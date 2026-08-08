---
id: mini-compiler
title: 통합 프로젝트 — 미니 컴파일러
sidebar_label: 통합 프로젝트
sidebar_position: 3
description: flex + bison + C로 소스 텍스트에서 3-주소 코드까지 만드는 완전한 컴파일러 프론트엔드.
---

# 통합 프로젝트 — 미니 컴파일러

교안 전체를 하나로 묶는 프로젝트다.
**소스 텍스트에서 3-주소 코드까지**, 컴파일러 프론트엔드를 온전히 만든다.

```mermaid
flowchart LR
    A["소스"] -->|"mini.l<br/>flex"| B["토큰"]
    B -->|"mini.y<br/>bison"| C["AST"]
    C -->|"mini.c<br/>check_program"| D["타입 붙은 AST<br/>+ 심볼 테이블"]
    D -->|"mini.c<br/>gen_program"| E["3-주소 코드"]
    style A fill:#e8e7fd,stroke:#4f46e5
    style E fill:#e3f5ec,stroke:#0f9d58
```

**디렉터리** `examples/08-mini-compiler`
**저장소** [kokoa-study-room/compiler-study-site](https://github.com/kokoa-study-room/compiler-study-site)

```bash
git clone https://github.com/kokoa-study-room/compiler-study-site.git
cd compiler-study-site/examples/08-mini-compiler
make && make test
```

---

## 1. 언어

```
program := decl* stmt*

decl    := ("int" | "float") ID ("," ID)* ";"

stmt    := ID "=" expr ";"
         | "if" "(" expr ")" stmt [ "else" stmt ]
         | "while" "(" expr ")" stmt
         | "print" expr ";"
         | "{" stmt* "}"
         | ";"

expr    := 산술(+ - * / %) · 관계(< > <= >= == !=) · 논리(&& ||) · 단항(-)
           우선순위는 C 와 같다
```

주석은 `//` 와 `/* */` 를 모두 지원한다 (중첩은 안 된다).

---

## 2. 실행

```bash
cd examples/08-mini-compiler
make && make test

./minic    < tests/basic.in      # 3-주소 코드
./minic -a < tests/ast.in        # AST 도 함께
./minic    < tests/errors.in     # 의미 오류 진단
./minic    < tests/dangling.in   # dangling else
```

### 전체 예제

```c title="tests/basic.in"
// 미니 언어 예제 — 팩토리얼과 평균
int n, i, fact;
float sum, avg;

n = 5;
i = 1;
fact = 1;

while (i <= n) {
    fact = fact * i;
    i = i + 1;
}
print fact;

/* 정수를 float 에 대입하면 조용히 확대된다 */
sum = 0;
i = 1;
while (i <= n) {
    sum = sum + i;
    i = i + 1;
}
avg = sum / n;
print avg;

if (avg > 2 && fact > 100)
    print 1;
else
    print 0;
```

출력:

```
=== 심볼 테이블 ===
  n            int    (2행 선언)
  i            int    (2행 선언)
  fact         int    (2행 선언)
  sum          float  (3행 선언)
  avg          float  (3행 선언)
=== 3-주소 코드 ===
  n = 5
  i = 1
  fact = 1
L1:
  t1 = i <= n
  ifFalse t1 goto L2
  t2 = fact * i
  fact = t2
  t3 = i + 1
  i = t3
  goto L1
L2:
  print fact
  t4 = inttofloat 0
  sum = t4
  i = 1
L3:
  t5 = i <= n
  ifFalse t5 goto L4
  t6 = inttofloat i
  t7 = sum + t6
  sum = t7
  t8 = i + 1
  i = t8
  goto L3
L4:
  t9 = inttofloat n
  t10 = sum / t9
  avg = t10
  print avg
  t11 = inttofloat 2
  t12 = avg > t11
  t13 = fact > 100
  t14 = t12 && t13
  ifFalse t14 goto L5
  print 1
  goto L6
L5:
  print 0
L6:
----
컴파일 성공
```

---

## 3. 파일 구성

| 파일 | 담당 | 교안 |
|---|---|---|
| `mini.l` | ① 어휘 분석 | [3부](/docs/lex/lex-overview) |
| `mini.y` | ② 구문 분석 + AST 구성 | [4·5부](/docs/yacc/yacc-grammar-and-actions) |
| `mini.c` | ③ 의미 분석, ④ 중간 코드 생성 | [1장](/docs/foundations/compiler-overview) |
| `mini.h` | 공용 선언 | |

[1장에서 본](/docs/foundations/compiler-overview#12-컴파일러의-단계)
컴파일러 6단계 중 ①~④ 를 담았다.

:::tip[액션은 짧게, 로직은 별도 파일에]
`mini.y` 의 액션은 대부분 한 줄이다.

```c
| expr '+' expr    { $$ = node_binop("+", $1, $3, yylineno); }
```

노드를 만드는 함수 하나만 부른다.
문법 파일이 문법으로 읽히도록 유지하는 것이 중요하다.
:::

---

## 4. 확인할 것

### ① AST에 우선순위가 새겨진다

```bash
printf 'int x;\nfloat y;\nx = 2 + 3 * 4;\ny = x / 2;\n' | ./minic -a
```

```
=== AST ===
  seq
    assign x
      + : int
        int 2
        * : int
          int 3
          int 4
    assign y
      (float)
        / : int
          var x : int
          int 2
```

`*` 가 `+` 보다 트리에서 **아래**에 있다.
`%left` 선언이 트리의 모양으로 나타난 것이다.

### ② 형 변환 노드가 트리에 실제로 삽입된다

위 AST의 `(float)` 노드를 보자. 소스에는 없던 노드다.
[1장에서 본](/docs/foundations/compiler-overview#-의미-분석-semantic-analysis)
`inttofloat` 삽입이 그대로 일어난 것이다.

```c title="mini.c"
static Node *coerce(Node *e, Type want)
{
    if (e->type == TY_INT && want == TY_FLOAT) {
        Node *c = node_new(N_CONV, e->line);
        c->a = e;
        c->type = TY_FLOAT;
        return c;      /* 트리를 실제로 고친다 */
    }
    return e;
}
```

### ③ 정수 나눗셈의 함정

```
y = x / 2;      // x 는 int, y 는 float
```
```
  t3 = x / 2          ← 정수 나눗셈!
  t4 = inttofloat t3
  y = t4
```

양쪽이 int이므로 **정수 나눗셈**을 하고, 그 **결과**를 float으로 올린다.
`x = 7` 이면 `y = 3.0` 이지 `3.5` 가 아니다.

C와 같은 의미론이고 실무에서 아주 흔한 버그다.
AST에서 `(float)` 노드가 `/` 노드 **위**에 있는 것이 그 증거다.

### ④ dangling else

```bash
./minic < tests/dangling.in
```

```
  t1 = a > 0
  ifFalse t1 goto L1
  t2 = a > 10
  ifFalse t2 goto L2
  b = 1
  goto L3
L2:
  b = 2
L3:
L1:
```

`L2`/`L3` 가 `L1` **안쪽**에 있다 — `else` 가 안쪽 `if` 에 붙었다.

`mini.y` 는 `%expect 1` 로 이 충돌을 **의도적으로 남겨** 두었다.
지우고 빌드하면 bison이 경고를 낸다.

```bash
bison -d -o /dev/null mini.y            # %expect 1 이 있으면 조용하다
sed 's/^%expect 1$//' mini.y > /tmp/x.y
bison -d -o /tmp/x.tab.c /tmp/x.y       # conflicts: 1 shift/reduce
```

### ⑤ CFG로 표현할 수 없는 것들

```bash
./minic < tests/errors.in
```

```
3행: 'a' 는 이미 1행에서 선언되었다
6행: 선언되지 않은 변수 'c' 에 대입
7행: int 변수 'b' 에 float 값을 대입한다 (암묵적 축소는 허용하지 않는다)
8행: % 연산자는 int 에만 쓸 수 있다 (int % float)
```

넷 다 **문맥 자유 문법으로는 표현할 수 없는** 규칙이다
([10장 참고](/docs/parsing/context-free-grammar#cfg로도-안-되는-것)).
그래서 파서가 아니라 **의미 분석 패스**가 잡는다.

이론적 한계가 컴파일러의 구조를 결정한 사례다.

### ⑥ 제어 흐름의 코드 생성

```c title="mini.c"
case N_WHILE: {
    int l_top  = new_label();
    int l_exit = new_label();
    emit_label(l_top);                              /* 조건 계산 앞 */
    const char *c = gen_expr(n->a);
    emit("ifFalse %s goto L%d", c, l_exit);
    gen(n->b);
    emit("goto L%d", l_top);
    emit_label(l_exit);
    break;
}
```

`L_top` 이 **조건 계산 앞**에 있어야 한다.
매 반복마다 조건을 다시 계산해야 하기 때문이다.

---

## 5. 확장 과제

난이도 순이다.

### 초급

1. **`%` 를 float에도 허용** — `fmod` 를 쓰도록 타입 규칙과 코드 생성을 고쳐라.
2. **`do ... while`** 을 추가하라. 조건 검사가 루프 **뒤**로 간다.
3. **`print` 에 여러 인자** — `print a, b, c;`

### 중급

4. **`for` 문** — 문법, AST 노드, 코드 생성 세 곳을 모두 고쳐야 한다.
   `for (i = 0; i < n; i = i + 1) S` 를 while로 낮추는(desugar) 방식도 좋다.
5. **상수 접기** — AST 순회로 `2 + 3 * 4` 를 `14` 로 접어라.
   타입 검사와 코드 생성 **사이**에 패스를 하나 넣는다.
   왜 파싱 액션에서 하면 안 되는지도 생각해 보라.
6. **죽은 코드 제거** — `if (0) S` 의 `S` 를 지워라.

### 상급

7. **단축 평가** — `&&` 와 `||` 를 C처럼 단축 평가하게 만들어라.
   지금의 값 방식으로는 안 되고 **점프 코드**가 필요하다.
   ```
   t1 = a > 0
   ifFalse t1 goto L_false     ← b 를 아예 계산하지 않는다
   t2 = b > 0
   ...
   ```
8. **스코프** — 블록마다 심볼 테이블을 밀고 당겨라.
   중간 액션 대신 **AST 순회에서** 처리하는 편을 권한다
   ([19장 참고](/docs/yacc/yacc-grammar-and-actions#스코프)).
9. **함수** — 정의와 호출을 추가하라. 스코프, 인자 전달, 반환값이 필요하다.
10. **가상 기계** — 3-주소 코드를 실제로 실행하는 인터프리터를 만들어라.
    이것을 만들면 컴파일러가 진짜로 동작하는지 확인할 수 있다.

---

## 6. 여기서 더 나아가려면

이 프로젝트는 컴파일러 6단계 중 ①~④ 를 다뤘다.
남은 ⑤ 최적화와 ⑥ 목적 코드 생성으로 가려면:

| 주제 | 시작점 |
|---|---|
| 기본 블록과 흐름 그래프 | 3-주소 코드를 블록으로 나누기 |
| 데이터 흐름 분석 | 도달 정의, 활성 변수 — [12장의 고정점 계산](/docs/parsing/syntax-analysis#123-first-집합)과 같은 패턴 |
| SSA 형식 | 최적화의 현대적 표준 |
| 레지스터 할당 | 그래프 색칠 또는 선형 스캔 |
| 명령 선택 | 트리 패턴 매칭 |
| **LLVM 백엔드에 붙이기** | 3-주소 코드 대신 LLVM IR을 뱉으면 최적화와 코드 생성을 전부 얻는다 |

마지막 항목이 실용적으로 가장 빠른 길이다.
[6부 도구 지형도](/docs/modern/toolchain-map)에서 다룬다.

---

축하한다. 컴파일러 프론트엔드를 처음부터 끝까지 만들었다.
