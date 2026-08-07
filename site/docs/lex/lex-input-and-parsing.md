---
id: lex-input-and-parsing
title: 8. LEX 입력 및 파싱
sidebar_label: 8. LEX 입력 및 파싱
sidebar_position: 2
description: lex가 여러 규칙 중 하나를 고르는 규칙 — 최장 일치와 규칙 우선순위, 되감기, 그리고 파서와 결합하는 방식.
---

# 8. LEX 입력 및 파싱

lex 입력 파일에는 보통 수십 개의 규칙이 들어간다.
입력의 어느 지점에서 **여러 규칙이 동시에 매치될 수 있다**.

```c
"if"                    { return IF; }
[A-Za-z_][A-Za-z0-9_]*  { return ID; }
```

입력이 `if`일 때 두 규칙 모두 매치된다. lex는 어느 쪽을 고를까?
입력이 `iffy`라면?

이 장의 주제가 그 결정 규칙이다.
**실무에서 만나는 어휘 분석 버그의 대부분이 여기서 나온다.**

---

## 8.1 두 가지 명확화 규칙

:::danger[lex의 매치 규칙]
1. **최장 일치(longest match)** — 가장 **긴** 문자열을 매치하는 규칙을 택한다.
2. **규칙 우선순위(rule priority)** — 길이가 **같으면**,
   파일에서 **먼저 쓰인** 규칙을 택한다.

이 순서가 중요하다. 길이가 먼저이고, 순서는 동점일 때의 결정법이다.
:::

두 규칙을 각각 확인해 보자.

### 최장 일치

```c
"<"     { return LT; }
"<="    { return LE; }
```

입력이 `<=`일 때, `"<"` 규칙이 먼저 쓰였지만 **`"<="` 가 이긴다**.
길이가 2로 더 길기 때문이다.

즉 **긴 연산자를 먼저 쓸 필요가 없다.**
`02-lex-tokenizer` 예제의 `tests/longest-match.in` 으로 확인할 수 있다.

```
입력:  a==b
출력:  ID(a)  RELOP(==)  ID(b)      ← "=" 두 개가 아니다

입력:  a= =b
출력:  ID(a)  ASSIGN(=)  ASSIGN(=)  ID(b)   ← 공백이 있으면 쪼개진다
```

`i++ + ++j` 도 보자.

```
ID(i)  INCDEC(++)  ARITHOP(+)  INCDEC(++)  ID(j)
```

C의 유명한 함정이 여기서 나온다. `a+++b` 는 최장 일치에 따라
`a ++ + b` 로 잘리지 `a + ++ b` 로 잘리지 않는다.
"maximal munch"라 부르는 이 규칙은 lex의 것이 아니라
**C 언어 표준이 그렇게 정한 것**이고, lex가 자연스럽게 그것을 구현한다.

### 규칙 우선순위

```c
"if"                    { return IF; }
[A-Za-z_][A-Za-z0-9_]*  { return ID; }
```

입력 `if` — 두 규칙 모두 길이 2로 매치된다. 동점이므로 **먼저 쓴 `"if"`** 가 이긴다.

순서를 뒤집으면 어떻게 될까?

```c
[A-Za-z_][A-Za-z0-9_]*  { return ID; }
"if"                    { return IF; }      /* ❌ 절대 도달하지 않는다 */
```

`if`가 `ID`로 분류된다. 파서는 `if`문을 인식하지 못한다.

:::tip[flex가 경고해 준다]
```bash
flex tokenizer.l
```
```
tokenizer.l:12: warning, rule cannot be matched
```
이 경고를 무시하지 말자. 거의 항상 규칙 순서가 잘못된 것이다.
:::

### 두 규칙이 함께 작동하는 예

입력 `iffy` 는?

- `"if"` 규칙 → 길이 2
- `{id}` 규칙 → 길이 4 ← **최장 일치로 승리**

결과는 `ID(iffy)`. 예약어 규칙을 먼저 썼다고 해서
`if` + `fy` 로 쪼개지지 않는다. 최장 일치가 먼저 적용되기 때문이다.

이것이 **예약어를 정규 표현으로 나열해도 안전한 이유**다.

---

## 8.2 매치 과정의 실제

lex가 한 토큰을 잘라내는 과정을 단계별로 보자.
간단한 규칙 집합을 예로 든다.

```c
"for"   { return FOR; }
[a-z]+  { return ID; }
```

입력: `format`

```mermaid
flowchart TB
    A["시작: 위치 0"] --> B["문자를 하나씩 읽으며<br/>DFA 상태를 옮긴다"]
    B --> C["f, o, r 읽음<br/>→ FOR 수락 상태 (길이 3)"]
    C --> D["기록: 마지막 수락 = FOR, 길이 3"]
    D --> E["계속 읽는다: m, a, t<br/>→ ID 수락 상태 (길이 6)"]
    E --> F["기록 갱신: 마지막 수락 = ID, 길이 6"]
    F --> G["더 읽을 수 없음<br/>(공백 또는 EOF)"]
    G --> H["마지막 수락 지점으로 확정<br/>→ ID(format), 6글자 소비"]
```

핵심은 **"수락 상태를 만나도 멈추지 않는다"** 는 것이다.
더 긴 매치가 있을지 모르므로 계속 읽어 나가면서
**마지막으로 지나간 수락 상태**를 기억해 둔다.

### 되감기(backtracking)

더 이상 진행할 수 없게 되면, 마지막 수락 지점까지 **되돌아간다**.
그 사이에 읽었던 문자들은 입력으로 되돌려진다.

입력 `fore` 에 대해 규칙이 `"for"` 와 `"form"` 뿐이라면:

```
f o r e
      ↑ 여기서 막힘 ('e'로는 "form"이 될 수 없다)
    ↑ 마지막 수락은 여기 (FOR, 길이 3)
→ FOR 반환, 'e'는 입력으로 되돌린다
```

:::caution[되감기는 성능 비용이다]
`flex -b` 로 되감기가 일어나는 지점을 보고서로 뽑을 수 있다.

```bash
flex -b tokenizer.l
cat lex.backup
```

되감기가 없는 스캐너는 **입력 문자를 정확히 한 번씩만** 읽는다.
성능이 중요하다면 되감기를 유발하는 규칙을 손봐야 하는데,
보통 "실패로 끝나는 접두사"를 명시적인 오류 규칙으로 잡아 주면 된다.

교육용/일반적 용도에서는 신경 쓰지 않아도 된다.
:::

### 아무 규칙도 매치되지 않으면

입력의 현재 위치에서 **한 글자도** 매치되지 않으면,
lex는 **기본 규칙**을 적용한다. 즉 그 한 글자를 `yyout`에 출력하고 넘어간다.

[7장에서 경고했듯이](/docs/lex/lex-overview#72-lex-입력-파일의-구조)
이것은 조용한 버그의 원인이다.
`02-lex-tokenizer` 예제는 마지막에 catch-all을 두어 막았다.

```c
.   {
      nerrors++;
      fflush(stdout);
      fprintf(stderr, "%4d  오류: 인식할 수 없는 문자 '%s'\n", yylineno, yytext);
    }
```

실행하면 이렇게 나온다.

```
$ ./tokenizer < tests/errors.in
   1  KEYWORD    int
   1  ID         x
   1  ASSIGN     =
   1  INT        1
   1  PUNCT      ;
   2  오류: 인식할 수 없는 문자 '@'
   2  오류: 인식할 수 없는 문자 '#'
   2  오류: 인식할 수 없는 문자 '$'
   3  KEYWORD    char
   3  ARITHOP    *
   3  ID         s
   3  ASSIGN     =
   3  오류: 인식할 수 없는 문자 '"'
   3  ID         unterminated
   3  PUNCT      ;
```

3행이 흥미롭다. 입력이 `char *s = "unterminated;` 였는데,
문자열 패턴이 닫는 따옴표를 못 찾아 매치에 실패했다.
그래서 `"` 한 글자가 오류가 되고, 그 뒤의 `unterminated` 가
평범한 식별자로 잘렸다.

:::note[어휘 오류 복구의 어려움]
스캐너는 "무엇이 잘못됐는지"를 알기 어렵다.
위 경우 사람은 "문자열이 안 닫혔다"고 바로 알지만,
스캐너 입장에서는 그냥 `"` 가 어떤 패턴에도 안 맞은 것일 뿐이다.

더 나은 진단을 주려면 **시작 조건**과 `<<EOF>>` 규칙을 써야 한다.
[다음 장](/docs/lex/writing-lex-files)의 `04-lex-states` 예제가 그렇게 한다.

```
$ ./states < tests/errors.in
   2  오류: 문자열 안에 개행
```
:::

---

## 8.3 매치를 제어하는 도구들

기본 규칙만으로 안 될 때 쓰는 장치들이다.

### `yyless(n)` — 일부만 소비하기

매치된 것 중 앞 `n`글자만 소비하고 나머지를 입력으로 되돌린다.

```c
/* "=-" 를 "=" 와 "-" 로 나누고 싶다 */
"=-"    { yyless(1); return ASSIGN; }   /* '-' 는 되돌린다 */
```

`yyless(0)` 은 **아무것도 소비하지 않는다**.
시작 조건을 바꾸면서 같은 텍스트를 다시 스캔할 때 유용하다.

:::danger[`yyless(0)`에 시작 조건 변경이 없으면 무한 루프다]
```c
"foo"   { yyless(0); }        /* ❌ 영원히 "foo"를 다시 본다 */
"foo"   { yyless(0); BEGIN(OTHER); }   /* ✅ 다음엔 다른 규칙이 적용된다 */
```
:::

### `yymore()` — 이어 붙이기

다음 매치를 `yytext` 뒤에 **이어 붙인다**.
조각조각 매치되는 것을 하나로 모을 때 쓴다.

```c
\"[^"]*     { yymore(); }         /* 닫는 따옴표를 못 찾으면 계속 모은다 */
\"[^"]*\"   { return STRING; }    /* yytext 에 전체가 들어 있다 */
```

### `unput(c)` — 입력에 밀어 넣기

문자 하나를 입력 스트림 앞에 되돌려 넣는다.

:::caution[`unput()`은 `yytext`를 파괴한다]
`unput()`을 부르면 `yytext`의 내용이 보장되지 않는다.
`yytext`가 필요하면 먼저 복사해 두자.
:::

### `REJECT` — 차선책으로 넘어가기

이번 매치를 취소하고, **그 다음으로 좋은** 규칙을 시도한다.
겹치는 패턴을 모두 세고 싶을 때 쓴다.

```c
/* 입력에서 "she"와 "he"를 각각 센다. "she" 안의 "he"도 센다 */
she     { s_count++; REJECT; }
he      { h_count++; REJECT; }
.|\n    { /* 무시 */ }
```

:::danger[`REJECT`는 스캐너 전체를 느리게 만든다]
`REJECT`가 한 번이라도 나타나면 flex는
**모든 규칙에 대해 되감기 정보를 유지**하도록 코드를 생성한다.
스캐너 크기와 실행 시간이 크게 늘어난다.

`flex -v` 로 확인해 보면 차이가 보인다.
대안(시작 조건, `yyless`, 후처리)이 있다면 그쪽을 택하자.
:::

---

## 8.4 예약어 처리 — 두 가지 방법

예약어가 30개쯤 되면 규칙을 30줄 쓰는 것이 부담스러워진다.

### 방법 1 — 규칙으로 나열

```c
"if"        { return IF; }
"else"      { return ELSE; }
"while"     { return WHILE; }
/* ... 30줄 ... */
{id}        { return ID; }
```

**장점** — 명확하고, 순서 규칙만 지키면 안전하다.
**단점** — DFA가 커진다. 예약어마다 별도의 상태 경로가 생긴다.

`02-lex-tokenizer`는 이 방법을 쓴다.
`flex -v` 결과 NFA 273상태 중 상당수가 예약어 때문이다.

### 방법 2 — 심볼 테이블 조회

```c
%{
static const struct { const char *name; int token; } keywords[] = {
    {"if", IF}, {"else", ELSE}, {"while", WHILE}, /* ... */
};

static int lookup_keyword(const char *s)
{
    for (size_t i = 0; i < sizeof keywords / sizeof keywords[0]; i++)
        if (strcmp(keywords[i].name, s) == 0)
            return keywords[i].token;
    return ID;      /* 예약어가 아니면 식별자 */
}
%}

%%
{id}    { return lookup_keyword(yytext); }
```

**장점** — DFA가 작다. 예약어 추가가 배열 한 줄이다.
**단점** — 조회 비용이 든다 (해시 테이블을 쓰면 무시할 만하다).

:::tip[실무에서는 방법 2가 더 흔하다]
GCC, Clang을 포함해 손으로 쓴 스캐너는 거의 모두 방법 2를 쓴다.
"식별자를 하나 잘라낸 뒤 예약어인지 조회한다"는 구조다.

`gperf` 같은 완전 해시 생성기를 쓰면 조회가 **충돌 없는 상수 시간**이 된다.
GCC가 실제로 gperf를 쓴다.
:::

---

## 8.5 파서와 결합하기

lex가 만든 스캐너를 파서와 어떻게 연결하는지 미리 보아 두자.
자세한 것은 [5부 YACC](/docs/yacc/yacc-overview)에서 다룬다.

### 제어 흐름

**파서가 주도한다.** 스캐너는 요청받을 때마다 토큰 하나를 만들어 준다.

```mermaid
sequenceDiagram
    participant M as main()
    participant P as yyparse()
    participant L as yylex()
    M->>P: yyparse()
    loop 파스가 끝날 때까지
      P->>L: yylex()
      L-->>P: 토큰 코드 + yylval
    end
    P-->>M: 0 (성공) 또는 1 (구문 오류)
```

### 세 가지 계약

**① 토큰 코드** — `yylex()`의 반환값.
yacc가 `%token` 선언에서 정수 상수를 만들어 `y.tab.h`에 넣어 준다.

```c
/* y.tab.h — bison -d 가 생성 */
#define IF   258
#define ELSE 259
#define ID   260
```

lex 파일은 이 헤더를 include 한다.

```c
%{
#include "y.tab.h"
%}
```

:::caution[토큰 코드는 258부터 시작한다]
0~255는 **문자 하나짜리 토큰**을 위해 비워 둔다.
`return '+';` 처럼 문자를 그대로 반환할 수 있다.
256, 257은 yacc가 내부적으로(`$end`, `error`) 쓴다.
:::

**② 의미 값** — `yylval` 전역 변수.
토큰의 "값"(식별자 이름, 숫자 값)을 파서에 전달한다.

```c
{num}   { yylval.num = atoi(yytext);  return NUM; }
{id}    { yylval.str = strdup(yytext); return ID; }
```

`yylval`의 타입은 yacc 파일의 `%union` 선언이 정한다.

**③ 입력 끝** — `yylex()`가 **0을 반환**하면 파서는 입력이 끝난 것으로 본다.
`%option noyywrap` 을 쓰면 EOF에서 자동으로 0이 반환된다.

### 빌드 순서

`y.tab.h`가 먼저 있어야 lex 파일이 컴파일된다.

```mermaid
flowchart LR
    Y["parser.y"] -->|"bison -d"| H["y.tab.h"]
    Y -->|"bison -d"| C1["y.tab.c"]
    H --> L["scanner.l"]
    L -->|"flex"| C2["lex.yy.c"]
    C1 --> CC[["cc"]]
    C2 --> CC
    CC --> E["실행 파일"]
```

Makefile에서 의존 관계를 잘못 쓰면
`y.tab.h: No such file or directory` 로 실패한다.
흔한 실수다.

---

## 8.6 실습 — 매치 규칙 확인하기

`02-lex-tokenizer` 예제로 직접 확인해 보자.

```bash
cd examples/02-lex-tokenizer
make
```

### 최장 일치

```bash
printf 'a==b\na= =b\ni++ + ++j\nx<=y<z\n' | ./tokenizer
```

`a==b` 는 `==` 하나로, `a= =b` 는 `=` 두 개로 잘린다.

### 규칙 순서 깨뜨려 보기

`tokenizer.l` 에서 `{id}` 규칙을 예약어 규칙들보다 **위로** 옮기고 다시 만들어 보자.

```bash
flex -o /dev/null tokenizer.l
```

```
tokenizer.l:NN: warning, rule cannot be matched
```

경고가 여러 줄 뜬다. 되돌려 놓자.

### 어떤 규칙이 매치되는지 추적

```bash
flex -d -o tokenizer_debug.c tokenizer.l
cc -o tokenizer_debug tokenizer_debug.c
echo 'if (x <= 10) return;' | ./tokenizer_debug
```

`-d` 로 만든 스캐너는 매치할 때마다
`--accepting rule at line NN ("텍스트")` 를 출력한다.
어느 규칙이 실제로 이겼는지 눈으로 볼 수 있다.

---

## 요약

- lex의 매치 규칙은 두 가지이고 **순서가 있다**.
  1. **최장 일치** — 더 긴 것을 택한다
  2. **규칙 우선순위** — 길이가 같으면 먼저 쓴 것을 택한다
- 이 순서 때문에 **긴 연산자를 먼저 쓸 필요는 없지만**,
  **예약어는 식별자보다 먼저 써야 한다**.
- `iffy` 가 `if`+`fy` 로 쪼개지지 않는 이유는 최장 일치가 먼저이기 때문이다.
- 스캐너는 수락 상태를 만나도 멈추지 않고 계속 읽으며
  **마지막 수락 지점**을 기억한다. 막히면 거기까지 **되감는다**.
- 아무 규칙도 안 맞으면 **기본 규칙**이 조용히 문자를 출력한다.
  반드시 catch-all을 두거나 `flex -s`를 쓴다.
- `yyless`, `yymore`, `unput`, `REJECT` 로 매치를 제어할 수 있으나
  `REJECT`는 스캐너 전체를 느리게 만든다.
- 예약어는 규칙으로 나열하거나 **심볼 테이블 조회**로 처리한다.
  후자가 DFA를 작게 유지한다.
- 파서와의 계약은 셋 — **토큰 코드**(반환값), **의미 값**(`yylval`),
  **입력 끝**(0 반환).

## 확인 문제

1. 다음 규칙 집합에서 입력 `abcd` 는 어떻게 잘리는가?
   ```c
   "ab"    { printf("1"); }
   "abc"   { printf("2"); }
   [a-z]+  { printf("3"); }
   ```
2. 위에서 규칙 순서를 바꾸면 결과가 달라지는가? 왜인가?
3. `a+++++b` 는 C에서 어떻게 토큰화되는가?
   그 결과가 문법적으로 올바른 C 식인가?
4. 다음 규칙이 왜 무한 루프를 일으키는지 설명하라.
   ```c
   [0-9]*  { return NUM; }
   ```
5. `REJECT` 없이 `she`/`he` 세기를 구현하라.
   (힌트: `yyless` 또는 후행 문맥)
6. 예약어 50개를 방법 1과 방법 2로 각각 구현하고
   `flex -v` 로 DFA 상태 수를 비교하라.

---

다음 장에서는 실제로 쓸 만한 lex 입력 파일을 작성하는 법 —
시작 조건, 파일 처리, 오류 진단 — 을 다룬다.
