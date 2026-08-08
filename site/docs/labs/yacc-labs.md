---
id: yacc-labs
title: YACC 실습
sidebar_label: YACC 실습
sidebar_position: 2
description: 같은 언어를 LL과 LR로 각각 만들어 보고, flex+bison 계산기로 우선순위와 오류 복구를 확인한다.
---

# YACC 실습

4·5부의 내용을 손으로 돌려 보는 과제 셋.

**아직 저장소를 안 받았다면 여기서부터.**

```bash
git clone https://github.com/kokoa-study-room/compiler-study-site.git
cd compiler-study-site/examples
make && make test
```

이미 받았다면 `examples/` 로 가면 된다.
막히면 [실습 환경 구성](/docs/labs/setup#3-저장소-내려받기)을 보자.

---

## 실습 6 — 재귀 하강 계산기 (LL)

**디렉터리** `examples/05-recursive-descent`
**관련 장** [13. LL 구문 분석](/docs/parsing/ll-parsing)

넌터미널 하나에 함수 하나. 도구 없이 손으로 쓴 하향식 파서다.

```bash
cd examples/05-recursive-descent
make && make test
echo "1 + 2 * (3 - 1)" | ./calc
```

```
식: 1 + 2 * (3 - 1)
  AST: (+ 1 (* 2 (- 3 1)))
  값: 5
```

### 확인할 것 ① — 호출 스택이 곧 파싱 스택

```bash
echo "1 + 2 * 3" | ./calc -t
```

```
  → expr   (lookahead = number)
    → term   (lookahead = number)
      → factor   (lookahead = number)
      ← factor
    ← term
    → term   (lookahead = number)
      → factor   (lookahead = number)
      ← factor
      → factor   (lookahead = number)
      ← factor
    ← term
  ← expr
```

들여쓰기가 곧 스택 깊이다.
[13장의 표 구동 예측 파서](/docs/parsing/ll-parsing#132-표-구동-예측-파싱)에서
명시적 스택이 하던 일을 여기서는 호출 스택이 한다.

### 확인할 것 ② — 좌결합을 만드는 한 줄

```c
static Node *parse_term(void)
{
    Node *left = parse_factor();
    while (tok == T_STAR || tok == T_SLASH) {
        char op = (tok == T_STAR) ? '*' : '/';
        advance();
        Node *right = parse_factor();
        left = new_binop(op, left, right);   /* ← 왼쪽으로 접는다 */
    }
    return left;
}
```

좌재귀 $T \to T * F$ 를 제거하면 EBNF 반복 `{ }` 이 되고,
그것이 `while` 루프가 된다. 그런데 그냥 두면 트리가 **오른쪽**으로 자란다.
`left = new_binop(...)` 이 한 줄이 좌결합을 되살린다.

```
100 / 5 / 2  →  (/ (/ 100 5) 2)  =  10     ✅ 좌결합
             →  (/ 100 (/ 5 2))  =  50     ❌ 이 줄이 없으면
```

**이것이 좌재귀 제거의 실질적 대가다.**

### 확인할 것 ③ — 문맥을 아는 오류 메시지

```bash
./calc < tests/errors.in
```

```
식: (1 + 2
  오류 7열 | 기대: ')' | 실제: 입력 끝 | 문맥: 괄호식
식: 1 + * 2
  오류 5열 | 기대: 수 또는 '(' | 실제: '*' | 문맥: factor
```

"지금 어느 함수 안에 있는가"가 곧 문맥이다.
표 구동 파서에서는 이 정보를 얻기 어렵다.

### 과제

1. 거듭제곱 `^` 를 **우결합**으로 추가하라.
   (힌트: `while` 이 아니라 재귀를 써야 한다)
2. 함수 호출 `sin(x)` 를 추가하라.
3. 오류 후에도 다음 식을 계속 처리하도록 복구를 넣어라.

---

## 실습 7 — 표 구동 LR 파서

**디렉터리** `examples/06-lr-table-driven`
**관련 장** [16. LR 파서의 구현](/docs/parsing/lr-parser-implementation)

[15장에서 손으로 만든 SLR(1) 표](/docs/parsing/lr-parsing#완성된-표)를
그대로 C 배열로 옮긴 파서다.

```bash
cd examples/06-lr-table-driven
make && make test
echo "2 + 3 * 4" | ./lrparse -t
```

```
   # | stack                        | input          | action
   1 | 0                            | 2 + 3 * 4 $    | 이동 s5
   2 | 0 num 5                      | + 3 * 4 $      | 축약 r6 : F  -> num
   3 | 0 F 3                        | + 3 * 4 $      | 축약 r4 : T  -> F
   4 | 0 T 2                        | + 3 * 4 $      | 축약 r2 : E  -> T
   5 | 0 E 1                        | + 3 * 4 $      | 이동 s6
   6 | 0 E 1 + 6                    | 3 * 4 $        | 이동 s5
   7 | 0 E 1 + 6 num 5              | * 4 $          | 축약 r6 : F  -> num
   8 | 0 E 1 + 6 F 3                | * 4 $          | 축약 r4 : T  -> F
   9 | 0 E 1 + 6 T 9                | * 4 $          | 이동 s7
  10 | 0 E 1 + 6 T 9 * 7            | 4 $            | 이동 s5
  11 | 0 E 1 + 6 T 9 * 7 num 5      | $              | 축약 r6 : F  -> num
  12 | 0 E 1 + 6 T 9 * 7 F 10       | $              | 축약 r3 : T  -> T * F
  13 | 0 E 1 + 6 T 9                | $              | 축약 r1 : E  -> E + T
  14 | 0 E 1                        | $              | 수락
  값: 14
  축약을 역순으로 읽으면 우측 유도: r1 -> r3 -> r6 -> r4 -> r6 -> r2 -> r4 -> r6
```

### 확인할 것 ① — 9번 행

스택이 `E + T` 이고 입력이 `*` 다.
`E → E + T` 로 축약할 수도 있었지만 표가 **이동**을 지시한다.

`ACTION[9, *] = s7` 이기 때문이고, 그 칸이 그렇게 채워진 이유는
상태 9의 항목 집합에서 `*` 가 FOLLOW($E$)에 **없기** 때문이다.

**문법을 계층화한 것이 → 표의 한 칸으로 → "곱셈이 먼저"라는 결과로** 이어진다.

### 확인할 것 ② — 값 스택

```c
case 1: v = val_stack[sp - 2] + val_stack[sp]; break;  /* E → E + T */
case 3: v = val_stack[sp - 2] * val_stack[sp]; break;  /* T → T * F */
```

이것이 yacc의 `$$ = $1 + $3;` 의 정체다.
`$n` 은 **값 스택의 인덱스**일 뿐이다.

### 확인할 것 ③ — 표에서 뽑는 오류 메시지

```bash
./lrparse < tests/errors.in
```

```
식: 2 +
  오류 4열 | 실제: $ | 기대: num, ( | 상태: 6
식: 2 2
  오류 3열 | 실제: num | 기대: +, *, ), $ | 상태: 5
```

"기대하는 토큰"은 표의 그 행에서 오류가 아닌 열을 모은 것이다.
bison의 `syntax error, unexpected X, expecting Y or Z` 가 이것이다.

### 과제

1. 나눗셈 `/` 를 추가하라. **표를 다시 만들어야 한다.**
   05번 예제에 같은 기능을 추가하는 것과 손이 얼마나 다른지 비교하라.
2. `-` 를 추가해 보라. 상태가 몇 개 늘어나는가?
3. 05와 06을 같은 입력으로 돌리고, 액션 실행 순서를 비교하라.

---

## 실습 8 — flex + bison 계산기

**디렉터리** `examples/07-yacc-calc`
**관련 장** [18. YACC 개요](/docs/yacc/yacc-overview),
[20. 충돌과 우선순위](/docs/yacc/conflicts-and-precedence)

두 도구를 처음으로 결합한다.

```bash
cd examples/07-yacc-calc
make && make test
./calc < tests/basic.in
```

### 확인할 것 ① — 모호한 문법인데 충돌이 0개

```c
expr : expr '+' expr | expr '*' expr | ... ;
```

이 문법은 **모호하다**. 그런데도

```bash
bison -d -v -o calc.tab.c calc.y     # 아무 경고도 안 나온다
```

`%left`, `%right` 선언이 모든 shift/reduce 충돌을 해소했기 때문이다.
15장에서 손으로 $E/T/F$ 계층을 만든 것과 같은 효과를, 5줄로 얻는다.

### 확인할 것 ② — 우선순위 선언의 효과

```
2 ^ 3 ^ 2   →  512    %right '^' — 우결합
-2 ^ 2      →  -4     UMINUS < '^' 이므로 -(2^2)
-2 * 3      →  -6     UMINUS > '*' 이므로 (-2)*3
```

`calc.y` 에서 `%right UMINUS` 와 `%right '^'` 의 **순서를 바꿔** 다시 빌드하고
`-2 ^ 2` 를 넣어 보자. `4` 가 나온다.

### 확인할 것 ③ — 오류 복구

```bash
./calc < tests/errors.in
```

```
1행: syntax error
2행: 정의되지 않은 변수 'z'
  = 1
3행: 0으로 나눌 수 없다
  = 0
  = 5
5행: syntax error
  = 16
----
오류 4건
```

`| error EOL { yyerrok; }` 한 줄이
**첫 오류에서 멈추지 않게** 만든다.

### 확인할 것 ④ — `.output` 읽기

```bash
bison -d -v -o calc.tab.c calc.y
sed -n '/^state 22$/,/^state 23$/p' calc.output
```

```
state 22

   14 expr: expr '^' . expr

    NUM  shift, and go to state 4
    ID   shift, and go to state 13
    '-'  shift, and go to state 7
    '('  shift, and go to state 8

    expr  go to state 30
```

`14 expr: expr '^' . expr` 은 **LR(0) 항목** 그 자체다.
15장에서 손으로 만든 것을 bison이 계산해 적어 놓았다.

### 과제

1. `%nonassoc` 으로 `1 < 2 < 3` 을 오류로 만들어라.
2. 삼항 연산자 `a ? b : c` 를 추가하라 (우결합).
3. 변수를 지우는 명령을 추가하라.
4. `%error-verbose`(bison 2.x) 또는 `%define parse.error verbose`(3.x)를
   켜고 오류 메시지가 어떻게 달라지는지 확인하라.

---

## 실습을 마치며 — 세 파서 비교

같은 산술식 언어를 세 방식으로 만들었다.

| | 05 재귀 하강 | 06 표 구동 LR | 07 flex+bison |
|---|---|---|---|
| 방향 | 하향식 (LL) | 상향식 (LR) | 상향식 (LALR) |
| 문법 | 좌재귀 제거 필요 | 좌재귀 그대로 | 모호해도 됨 |
| 결합성 | 액션에서 접음 | 문법이 결정 | **선언 한 줄** |
| 표 | 없음 | **손으로 작성** | 자동 생성 |
| 코드 길이 | 250줄 | 260줄 | 문법 150줄 + 스캐너 40줄 |
| 문법 변경 | 함수 수정 | **표 재작성** | 규칙 한 줄 |
| 오류 메시지 | 문맥을 안다 | 기대 토큰 | 기대 토큰 |

06번의 표를 손으로 유지할 수 없다는 것이 yacc의 존재 이유이고,
05번의 오류 메시지 품질이 실제 컴파일러들이 여전히 손으로
재귀 하강 파서를 쓰는 이유다.

---

다음은 [통합 프로젝트](/docs/labs/mini-compiler)다.
