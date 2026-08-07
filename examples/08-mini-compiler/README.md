# 08 · 미니 언어 컴파일러 (통합 프로젝트)

flex + bison + 손으로 쓴 C 로, **소스 텍스트에서 3-주소 코드까지** 만든다.
교안 1장에서 본 컴파일러 6단계 중 ①~④ 를 전부 담았다.

```
mini.l   ① 어휘 분석
mini.y   ② 구문 분석 + AST 구성
mini.c   ③ 의미 분석 (심볼 테이블, 타입 검사, 형 변환 삽입)
         ④ 중간 코드 생성 (3-주소 코드)
```

## 언어

```
program := decl* stmt*
decl    := ("int" | "float") ID ("," ID)* ";"
stmt    := ID "=" expr ";"
         | "if" "(" expr ")" stmt [ "else" stmt ]
         | "while" "(" expr ")" stmt
         | "print" expr ";"
         | "{" stmt* "}"
expr    := 산술 · 관계 · 논리 연산 (C 와 같은 우선순위)
```

## 실행

```bash
make && make test
./minic    < tests/basic.in      # 3-주소 코드
./minic -a < tests/ast.in        # AST 도 함께
./minic    < tests/errors.in     # 의미 오류 진단
./minic    < tests/dangling.in   # dangling else
```

## 보는 것

### ① 액션에서 AST 조립하기

```
| expr '+' expr    { $$ = node_binop("+", $1, $3, yylineno); }
```

파스 트리를 실제로 만들지 않는다. 축약할 때마다 AST 노드를 하나씩 붙인다.

### ② 형 변환 노드 삽입

1장에서 본 `inttofloat` 삽입이 그대로 일어난다.

```
sum = sum + i;      // sum 은 float, i 는 int
```
```
  t6 = inttofloat i
  t7 = sum + t6
  sum = t7
```

`-a` 로 AST 를 보면 `(float)` 변환 노드가 트리에 실제로 끼워져 있다.

:point_right: `y = x / 2;` (x 는 int, y 는 float) 를 보자.
`x / 2` 는 **정수 나눗셈**을 한 뒤 결과를 float 으로 올린다.
C 와 같은 의미론이고, 흔한 버그의 원인이기도 하다.

### ③ dangling else

`%expect 1` 로 충돌 1개를 **의도적으로 남겨** 두었다.
bison 은 기본적으로 shift 를 택하므로 `else` 는 **가장 가까운 if** 에 붙는다.

`tests/dangling.in` 의 출력에서 `L2`/`L3` 가 `L1` **안쪽**에 있는 것으로
안쪽 if 에 붙었음을 확인할 수 있다.

`%expect 1` 을 지우고 빌드하면 bison 이 경고를 낸다.
반대로 실수로 충돌이 하나 더 생기면 `%expect` 덕분에 빌드가 실패한다 —
회귀 방지 장치다.

### ④ 제어 흐름의 3-주소 코드

```
while (i <= n) { ... }
```
```
L1:
  t1 = i <= n
  ifFalse t1 goto L2
  ...
  goto L1
L2:
```

조건을 임시변수에 담는 **값 방식**이다.
백패칭을 쓰는 점프 코드 방식보다 단순하고, 최적화에서 어차피 정리된다.

### ⑤ 오류 진단

```
$ ./minic < tests/errors.in
3행: 'a' 는 이미 1행에서 선언되었다
6행: 선언되지 않은 변수 'c' 에 대입
7행: int 변수 'b' 에 float 값을 대입한다 (암묵적 축소는 허용하지 않는다)
8행: % 연산자는 int 에만 쓸 수 있다 (int % float)
```

이 셋은 전부 **문맥 자유 문법으로 표현할 수 없는** 규칙이다
(교안 10장 참고). 그래서 파서가 아니라 의미 분석 패스가 잡는다.

## 확장 과제

1. `for` 문을 추가하라.
2. 함수 정의와 호출을 추가하라 (심볼 테이블에 스코프가 필요해진다).
3. 상수 접기(constant folding)를 AST 위에서 수행하라. `2 + 3 * 4` → `14`.
4. `&&` / `||` 를 **단축 평가**로 바꿔라 (점프 코드 방식이 필요하다).
5. 3-주소 코드를 실제로 실행하는 가상 기계를 만들어라.
