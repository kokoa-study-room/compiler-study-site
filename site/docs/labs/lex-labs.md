---
id: lex-labs
title: LEX 실습
sidebar_label: LEX 실습
sidebar_position: 1
description: flex로 만드는 네 가지 스캐너 — wc 흉내, C 토크나이저, 손으로 쓴 DFA, 시작 조건.
---

# LEX 실습

2·3부에서 배운 것을 손으로 돌려 보는 과제 다섯.
모든 코드는 저장소의 `examples/` 아래에 있고, `make test` 로 검증된다.

**아직 저장소를 안 받았다면 여기서부터.**

```bash
git clone https://github.com/kokoa-study-room/compiler-study-site.git
cd compiler-study-site/examples
```

```bash
make            # 전체 빌드
make test       # 전체 테스트
```

도구가 없어 막히면 [실습 환경 구성](/docs/labs/setup#1-도구-설치)을,
저장소 구조가 궁금하면 [4절](/docs/labs/setup#4-예제-저장소-구조)을 보자.

---

## 실습 1 — flex로 만드는 `wc`

**디렉터리** `examples/01-lex-wordcount`
**관련 장** [7. LEX](/docs/lex/lex-overview)

lex 입력 파일의 가장 작은 완전한 예. 줄·단어·문자 수를 센다.

```bash
cd examples/01-lex-wordcount
make && make test
printf 'hello world\nthe quick brown fox\n' | ./wordcount
```

```
lines=2 words=6 chars=32
```

### 확인할 것

- **세 부분 구조** — `정의부 %% 규칙부 %% 사용자 코드`
- `yytext`(매치된 문자열)와 `yyleng`(길이)
- 세 규칙 `{word}`, `\n`, `[ \t]` 가 **입력 전체를 덮는다**는 것.
  덮지 않으면 기본 규칙이 조용히 작동한다

### 진짜 `wc`와 비교

```bash
wc -lwc tests/basic.in
./wordcount < tests/basic.in
```

### 과제

1. 가장 긴 단어와 그 길이도 출력하게 고쳐라.
2. 단어 빈도수 상위 5개를 출력하게 확장하라.
   (`yytext`를 **복사**해야 한다는 점에 주의)
3. `flex -v` 로 NFA/DFA 상태 수를 확인하고,
   규칙을 하나 추가했을 때 어떻게 변하는지 관찰하라.

---

## 실습 2 — C 부분집합 토크나이저

**디렉터리** `examples/02-lex-tokenizer`
**관련 장** [8. LEX 입력 및 파싱](/docs/lex/lex-input-and-parsing)

실제 컴파일러의 어휘 분석기와 같은 구조.
토큰을 종류·줄 번호와 함께 출력한다.

```bash
cd examples/02-lex-tokenizer
make && make test
./tokenizer < tests/basic.in
```

```
   1  KEYWORD    int
   1  ID         main
   1  PUNCT      (
   1  KEYWORD    void
   ...
   2  FLOAT      3.14e-2
   3  HEX        0xFF
   4  CHAR       'A'
   ...
----
토큰 48개, 오류 0개
```

### 확인할 것 ① — 최장 일치

```bash
./tokenizer < tests/longest-match.in
```

| 입력 | 결과 | 이유 |
|---|---|---|
| `a==b` | `ID  RELOP(==)  ID` | `==` 가 더 길다 |
| `a= =b` | `ID  ASSIGN  ASSIGN  ID` | 공백이 끊었다 |
| `i++ + ++j` | `ID  INCDEC  ARITHOP  INCDEC  ID` | maximal munch |
| `x<=y<z` | `ID  RELOP(<=)  ID  RELOP(<)  ID` | |

`"<"` 규칙이 `"<="` 보다 **먼저** 쓰였는데도 `<=` 가 이긴다는 데 주목하자.
최장 일치가 규칙 순서보다 우선한다.

### 확인할 것 ② — 규칙 순서

`tokenizer.l` 에서 `{id}` 규칙을 예약어 규칙들보다 **위로** 옮겨 보자.

```bash
flex -o /dev/null tokenizer.l
```

```
tokenizer.l:69: warning, rule cannot be matched
tokenizer.l:70: warning, rule cannot be matched
tokenizer.l:71: warning, rule cannot be matched
```

예약어 규칙이 전부 도달 불가능해진다. 되돌려 놓자.

### 확인할 것 ③ — 어떤 규칙이 이겼는지 보기

```bash
flex -d -o tok_dbg.c tokenizer.l
cc -w -o tok_dbg tok_dbg.c
echo 'if (x <= 10) return;' | ./tok_dbg
```

```
--accepting rule at line 69 ("if")
--accepting rule at line 58 (" ")
--accepting rule at line 96 ("(")
--accepting rule at line 73 ("x")
--accepting rule at line 86 ("<=")
--accepting rule at line 77 ("10")
--accepting rule at line 70 ("return")
```

`.l` 파일의 몇 번째 줄 규칙이 실제로 매치되었는지 그대로 나온다.

### 확인할 것 ④ — 오류 처리

```bash
./tokenizer < tests/errors.in
```

`@`, `#`, `$` 는 catch-all `.` 규칙에 걸려 오류가 된다.
그리고 닫히지 않은 문자열 `"unterminated;` 에서는
`"` 만 오류가 되고 나머지가 식별자로 잘린다 —
**어휘 수준에서는 좋은 진단을 내기 어렵다**는 사례다.
실습 4에서 이를 개선한다.

### 과제

1. 예약어를 규칙 나열 대신 **심볼 테이블 조회**로 바꾸고
   `flex -v` 로 DFA 상태 수를 비교하라.
2. 이진 리터럴 `0b1010` 을 추가하라.
3. `flex -b` 로 되감기 보고서(`lex.backup`)를 뽑고,
   되감기가 일어나는 규칙을 찾아 설명하라.

---

## 실습 3 — DFA를 손으로 구현하기

**디렉터리** `examples/03-dfa-by-hand`
**관련 장** [5. 유한 오토마타](/docs/regular/finite-automata)

flex 없이, 5장의 DFA를 그대로 C 코드로 옮긴다.
**lex가 대신 해 주는 일이 무엇인지** 체감하는 것이 목적이다.

```bash
cd examples/03-dfa-by-hand
make && make test
./dfa < tests/numbers.in
```

```
lexeme           table     direct    (a|b)*abb
---------------- --------- --------- ---------
0                INT       INT       거부
42               INT       INT       거부
3.14             FLOAT     FLOAT     거부
.5               INVALID   INVALID   거부
5.               INVALID   INVALID   거부
1e10             FLOAT     FLOAT     거부
2.5e-3           FLOAT     FLOAT     거부
1e               INVALID   INVALID   거부
abb              INVALID   INVALID   수락
ababb            INVALID   INVALID   수락
abba             INVALID   INVALID   거부
----
두 구현의 결과가 모두 일치한다.
```

### 확인할 것 ① — 상태 전이 추적

```bash
./dfa -t < tests/trace.in
```

```
[2.5e-3]
      시작 S0
      '2' : S0 -> S1
      '.' : S1 -> S2
      '5' : S2 -> S3
      'e' : S3 -> S4
      '-' : S4 -> S5
      '3' : S5 -> S6
      끝   S6 -> FLOAT

[12x]
      시작 S0
      '1' : S0 -> S1
      '2' : S1 -> S1
      'x' : S1 -> DEAD
      끝   DEAD -> INVALID
```

**죽은 상태**에 빠지면 남은 입력을 봐도 결과가 달라지지 않는다는 것을
코드에서 확인하자.

### 확인할 것 ② — 두 가지 구현

`dfa.c` 에는 같은 DFA가 두 번 구현되어 있다.

**전이표 구동** — flex가 생성하는 코드의 원리

```c
static const unsigned char DELTA[NSTATES][NCLASSES] = {
/* S0   */ {  S1, DEAD, DEAD, DEAD, DEAD },
/* S1   */ {  S1,   S2,   S4, DEAD, DEAD },
    ...
};

for (const char *p = s; *p; p++) {
    state = DELTA[state][class_of(*p)];
    if (state == DEAD) break;
}
return ACCEPT[state];
```

**직접 코딩** — re2c가 생성하는 코드의 원리

```c
s1: if (DIGIT)     { p++; goto s1; }
    if (*p == '.') { p++; goto s2; }
    if (EXPCH)     { p++; goto s4; }
    return *p == '\0' ? TK_INT : TK_INVALID;
```

프로그램은 매 입력마다 두 구현의 결과를 비교하고,
**하나라도 다르면 실패를 보고**한다.

### 확인할 것 ③ — 문자 클래스 압축

```c
enum { C_DIGIT, C_DOT, C_EXP, C_SIGN, C_OTHER, NCLASSES };
```

128열짜리 표 대신 **5열**이면 충분하다.
`'0'`~`'9'` 열 열이 완전히 같은 행을 갖기 때문이다.
flex는 이것을 **동등 클래스(equivalence class)** 라 부르고 자동으로 계산한다.
`flex -v` 출력의 `equivalence classes created` 항목이 그것이다.

### 과제

1. 16진 리터럴 `0x1F` 를 인식하도록 두 구현 모두에 상태를 추가하라.
   (두 구현이 계속 일치해야 한다)
2. 같은 언어를 flex로 작성하고 `flex -v` 로 DFA 상태 수를 비교하라.
   손으로 만든 8상태와 몇 개나 차이 나는가?
3. 5장의 `(a|b)*abb` DFA를 최소화해 보라. 더 줄일 수 있는가?

---

## 실습 4 — 시작 조건

**디렉터리** `examples/04-lex-states`
**관련 장** [9. LEX 입력 파일 작성](/docs/lex/writing-lex-files)

정규 표현 하나로는 안 되는 것들을 `%x` 시작 조건으로 해결한다.

```bash
cd examples/04-lex-states
make && make test
```

### 확인할 것 ① — 중첩 주석

```bash
./states < tests/nested.in
```

```
   1  COMMENT  1~1줄, 최대 중첩 깊이 2
   2  COMMENT  2~2줄, 최대 중첩 깊이 1
   3  COMMENT  3~6줄, 최대 중첩 깊이 2
----
단어 5개, 주석 3개, 문자열 0개, 오류 0개
```

`depth` 카운터가 있어야만 가능하다.
[3장의 펌핑 보조정리](/docs/regular/regular-languages#34-정규언어의-한계)로
증명했듯이 중첩 괄호 맞추기는 **정규언어가 아니다**.

### 확인할 것 ② — 문자열 이스케이프 해석

```bash
./states < tests/strings.in
```

```
   1  STRING   "hello<TAB>world<LF>"  (12바이트)
   2  STRING   "따옴표: " 역슬래시: \"  (28바이트)
   3  STRING   ""  (0바이트)
```

`\t`, `\n` 이 **실제 제어 문자로 해석되어** 값에 들어갔다.
정규 표현 하나로 매치만 했다면 이 해석을 따로 해야 한다.

### 확인할 것 ③ — EOF 진단

```bash
./states < tests/unclosed.in
```

```
   2  오류: 닫히지 않은 주석 (깊이 2)
```

`<COMMENT><<EOF>>` 규칙과, 주석 시작 줄을 기억해 둔 `cmt_start` 덕분에
**어디서 시작된 주석이 안 닫혔는지** 알려 줄 수 있다.
실습 2의 토크나이저가 내던 `오류: 인식할 수 없는 문자 '"'` 와 비교해 보자.

### 확인할 것 ④ — 성능을 위한 규칙 분할

```c
<COMMENT>[^*/\n]+   { }     /* 크게 삼킨다 */
<COMMENT>"*"        { }
<COMMENT>"/"        { }
<COMMENT>\n         { }
```

`<COMMENT>.` 하나로도 되지만 **한 글자씩** 매치하게 된다.
`[^*/\n]+` 는 `*`나 `/`가 나올 때까지 한 번에 삼킨다.

### 과제

1. 문자 상수 `'a'`, `'\n'` 을 처리하는 시작 조건 `CHR`를 추가하고,
   `'ab'` 처럼 두 글자 이상이면 오류를 내라.
2. Raw 문자열 `R"(...)"` (이스케이프 해석 없음)을 추가하라.
3. 중첩 깊이가 32를 넘으면 오류를 내라.
   왜 이런 제한이 실무적으로 필요한가?
4. `YY_USER_ACTION` 으로 열 번호를 추적하고
   오류 메시지를 `행:열` 형식으로 바꿔라.

---

## 실습 5 — 재진입 스캐너

**디렉터리** `examples/09-lex-reentrant`
**관련 장** [9.10 재진입 스캐너와 유니코드](/docs/lex/writing-lex-files#910-재진입-스캐너와-유니코드)

앞의 네 실습은 모두 스캐너가 하나였다.
`yytext`, `yyleng`, `yylineno` 가 전역 변수이므로 그럴 수밖에 없었다.

이번에는 스캐너를 **셋** 만들어 동시에 굴린다.

```bash
cd examples/09-lex-reentrant
make
printf 'one two 3\nfour 56\n' | ./reentrant
```

```
== 번갈아 읽기 ==
A: WORD   [alpha]     B: NUM    [99]
A: NUM    [12]        B: WORD   [gamma]
A: WORD   [beta]      B: OTHER  [?]
A: EOF    []          B: EOF    []

A: words=2 nums=1 other=0
B: words=1 nums=1 other=1

== 표준 입력 ==
C: words=3 nums=2 other=0
C: lines=2
```

**A와 B에서 토큰을 하나씩 번갈아 꺼내고 있다.**
전역 변수 방식이었다면 `tklex(a)` 가 채운 `yytext` 를
바로 다음 `tklex(b)` 가 덮어써 버린다.

### 바뀌는 것

| | 기본 | `%option reentrant` |
|---|---|---|
| 스캐너 상태 | 전역 변수 | `yyscan_t` 핸들 |
| 초기화 / 정리 | 없음 | `tklex_init(&sc)` / `tklex_destroy(sc)` |
| 호출 | `yylex()` | `tklex(sc)` |
| 입력 지정 | `yyin = fp` | `tkset_in(fp, sc)` / `tk_scan_string(s, sc)` |
| 사용자 데이터 | 전역 변수 | `YY_EXTRA_TYPE` + `tkset_extra` / `tkget_extra` |

`%option prefix="tk"` 는 생성되는 이름의 `yy` 를 `tk` 로 바꾼다.
**한 프로그램에 서로 다른 스캐너를 둘 이상 링크할 때** 필요한 옵션으로,
재진입(같은 스캐너의 여러 인스턴스)과는 별개의 문제다.

### 해 볼 것

1. `tok.l` 에서 `%option reentrant` 를 지우고 빌드해 보자.
   어떤 오류가 몇 개 나는가? 그 오류가 곧 "전역이 아니게 된 것들"의 목록이다.
2. `struct stats` 에 `longest` 를 추가해 각 스캐너가 만난
   가장 긴 단어의 길이를 기록하라. **전역 변수를 하나도 쓰지 않고** 할 수 있어야 한다.
3. bison 파서와 짝을 맞추려면 파서도 재진입이어야 한다.
   `07-yacc-calc` 를 `%define api.pure full` 로 바꿔 보자
   (bison 2.4 이상 필요 — macOS 기본 bison 2.3에서는 `%pure-parser`).

---

## 정리 — 어휘 분석기의 설계 원칙

다섯 실습을 관통하는 하나의 원칙이 있다.

> **이론이 허용하는 만큼만 도구에 맡기고, 나머지는 명시적으로 코드를 쓴다.**

| 하는 일 | 어디서 |
|---|---|
| 토큰 패턴 매치 | **정규 표현** → lex가 DFA로 컴파일 |
| 최장 일치·규칙 우선순위 | lex의 구동 루프 |
| 중첩 세기 | **액션 코드의 카운터** (정규언어 밖) |
| 이스케이프 해석 | **액션 코드** (매치와 동시에) |
| 예약어 판별 | 규칙 나열 **또는** 심볼 테이블 |
| 위치 추적 | `yylineno` + `YY_USER_ACTION` |

모든 것을 정규 표현으로 우겨넣으려 하면
[4장의 블록 주석 패턴](/docs/regular/regular-expressions#블록-주석의-함정)처럼
읽을 수 없는 것이 나온다.
경계를 알고 그 밖은 코드로 쓰는 것이 옳은 설계다.

---

다음은 [YACC 실습](/docs/labs/yacc-labs)이다.
그전에 [4부 구문 분석](/docs/parsing/context-free-grammar)을 읽자.
