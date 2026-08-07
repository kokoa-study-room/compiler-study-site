---
id: writing-lex-files
title: 9. LEX 입력 파일 작성
sidebar_label: 9. LEX 입력 파일 작성
sidebar_position: 3
description: 실전 lex 입력 파일 작성법 — 시작 조건, 중첩 주석, 문자열 리터럴, EOF 처리, 위치 추적, 흔한 실수.
---

# 9. LEX 입력 파일 작성

앞의 두 장에서 lex의 구조와 매치 규칙을 보았다.
이 장은 **실제로 쓸 만한 스캐너를 쓰는 법**이다.

교과서 예제와 실전 스캐너의 차이는 대체로 다음에서 나온다.

- 정규 표현 하나로 표현할 수 없는 것들 (중첩 주석, 들여쓰기 블록)
- 매치와 동시에 **값을 만들어야** 하는 것들 (문자열 이스케이프)
- 오류가 났을 때 **쓸 만한 진단**을 내는 일
- 파일 여러 개, `#include`, 위치 추적

이 전부를 lex는 **시작 조건(start condition)** 하나로 감당한다.

---

## 9.1 실전 스캐너의 뼈대

먼저 골격부터 잡아 두자. 대부분의 스캐너가 이 모양이다.

```c title="scanner.l 뼈대"
%option noyywrap
%option yylineno
%option noinput nounput
%option warn nodefault

%{
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "y.tab.h"          /* yacc 와 결합할 때 */

int yycolumn = 1;
static void count_columns(void);
%}

/* ── 정규 정의 ─────────────────────────── */
letter      [A-Za-z_]
digit       [0-9]
id          {letter}({letter}|{digit})*
ws          [ \t\r]+

/* ── 시작 조건 ─────────────────────────── */
%x COMMENT
%x STR

%%
 /* 규칙부. 앞의 공백 한 칸에 주의 — 1열에서 시작하면 패턴이 된다 */

{ws}        { /* 버린다 */ }
\n          { /* 줄 바꿈 */ }

{id}        { return ID; }
{digit}+    { yylval.num = atoi(yytext); return NUM; }

.           { fprintf(stderr, "%d행: 인식할 수 없는 문자 '%s'\n",
                      yylineno, yytext); }
%%

/* 사용자 코드 */
```

:::tip[`%option warn nodefault` 를 켜 두자]
- `warn` — 의심스러운 규칙에 경고를 낸다 (기본값이지만 명시해 두면 좋다)
- `nodefault` — **기본 규칙을 아예 만들지 않는다.**
  어떤 규칙에도 안 맞는 입력이 있으면 **컴파일 시점에 경고**가 뜬다.

[8장](/docs/lex/lex-input-and-parsing)에서 본 "조용한 기본 규칙" 문제를
근본적으로 막아 준다.
:::

---

## 9.2 시작 조건

**시작 조건**은 스캐너에 **모드**를 주는 장치다.
"지금 주석 안이다", "지금 문자열 안이다" 같은 상태를 표현한다.

### 선언

```c
%s INCLUDE      /* 포함적(inclusive) */
%x COMMENT      /* 배타적(exclusive) */
```

| | 조건 없는 규칙이 적용되는가 |
|---|---|
| `%s` **포함적** | ✅ 적용된다 |
| `%x` **배타적** | ❌ 적용되지 않는다 |

:::danger[거의 언제나 `%x`를 쓰자]
`%s`를 쓰면, 주석 안에서도 원래의 식별자·숫자 규칙이 계속 매치된다.
"주석 안에서는 오직 주석 규칙만" 이 대부분의 의도이므로 `%x`가 맞다.

`%s`가 유용한 경우는 "기본 동작에 규칙을 몇 개 **추가**하고 싶을 때"뿐이다.
:::

### 사용

```c
%x COMMENT
%%
"/*"                BEGIN(COMMENT);
<COMMENT>"*/"       BEGIN(INITIAL);
<COMMENT>.|\n       { /* 버린다 */ }
```

- `BEGIN(sc)` — 시작 조건을 `sc`로 바꾼다
- `INITIAL` — 기본 시작 조건. 이름이 예약되어 있다
- `<sc>패턴` — 시작 조건 `sc`일 때만 이 규칙을 적용
- `<sc1,sc2>패턴` — 여러 조건에서 적용
- `<*>패턴` — **모든** 조건에서 적용

:::caution[시작 조건 안에도 catch-all이 필요하다]
```c
%x COMMENT
%%
"/*"              BEGIN(COMMENT);
<COMMENT>"*/"     BEGIN(INITIAL);
/* ❌ COMMENT 안의 다른 문자를 처리하는 규칙이 없다 */
```
이러면 주석 본문의 문자들이 **기본 규칙으로 출력**된다.
`<COMMENT>.|\n ;` 을 반드시 넣자.
:::

### 조건 스택

`%option stack` 을 켜면 시작 조건을 스택으로 다룰 수 있다.

```c
%option stack
%%
"/*"    { yy_push_state(COMMENT); }
<COMMENT>"*/"   { yy_pop_state(); }
```

| 함수 | 하는 일 |
|---|---|
| `yy_push_state(sc)` | 현재 조건을 밀어 넣고 `sc`로 전환 |
| `yy_pop_state()` | 스택에서 꺼내 그 조건으로 복귀 |
| `yy_top_state()` | 스택 맨 위를 들여다본다 |

`#include` 중첩 처리에 특히 유용하다.

---

## 9.3 중첩 블록 주석

정규 표현으로 **표현할 수 없는** 첫 번째 실전 사례다.

[3장](/docs/regular/regular-languages#34-정규언어의-한계)에서 보았듯이
중첩 괄호 맞추기는 정규언어가 아니다.
따라서 어떤 정규 표현으로도 중첩 주석을 표현할 수 없다.

해결책은 **카운터 변수**다.

```c title="examples/04-lex-states/states.l (발췌)"
%x COMMENT

%{
static int depth = 0;
static int cmt_start = 0;
%}

%%

"/*"        { depth = 1; cmt_start = yylineno; BEGIN(COMMENT); }

<COMMENT>"/*"       { depth++; }
<COMMENT>"*/"       { if (--depth == 0) BEGIN(INITIAL); }
<COMMENT>[^*/\n]+   { /* 주석 본문 — 한 번에 크게 삼킨다 */ }
<COMMENT>"*"        { /* '*' 하나 */ }
<COMMENT>"/"        { /* '/' 하나 */ }
<COMMENT>\n         { /* yylineno 자동 증가 */ }
```

실행 결과:

```
$ ./states < tests/nested.in
   1  COMMENT  1~1줄, 최대 중첩 깊이 2
   2  COMMENT  2~2줄, 최대 중첩 깊이 1
   3  COMMENT  3~6줄, 최대 중첩 깊이 2
----
단어 5개, 주석 3개, 문자열 0개, 오류 0개
```

:::note[`depth`를 쓰는 순간 이론적 경계를 넘는다]
`depth`는 상한 없는 정수다. 유한 오토마타에는 그런 것이 없다.
즉 이 스캐너는 더 이상 순수한 DFA가 아니라
**DFA + 카운터**, 다시 말해 아주 제한된 형태의 푸시다운 오토마타다.

이것은 편법이 아니라 **의도된 설계**다.
lex는 "정규 표현으로 되는 것은 표로, 안 되는 것은 액션 코드로"라는
분업을 전제로 만들어졌다.
:::

### 세 규칙으로 나눈 이유

```c
<COMMENT>[^*/\n]+   { }
<COMMENT>"*"        { }
<COMMENT>"/"        { }
```

`<COMMENT>.` 하나면 될 것을 왜 셋으로 나눴을까? **성능** 때문이다.

`.` 규칙만 있으면 주석 본문의 문자를 **한 글자씩** 매치한다.
`[^*/\n]+` 는 `*`나 `/`가 나올 때까지 **한 번에** 삼킨다.
매치 횟수가 수십 분의 일로 줄어든다.

`*`와 `/`를 따로 둔 이유는, 그 문자들이 `[^*/\n]+`에서 제외되었으므로
별도로 처리해 주어야 하기 때문이다.
(`*/`나 `/*`가 아닌 홀로 있는 `*`, `/`)

---

## 9.4 문자열 리터럴

[4장](/docs/regular/regular-expressions#46-정규-표현으로-토큰-정의하기)에서
문자열 패턴을 이렇게 썼다.

```
\"([^"\\\n]|\\.)*\"
```

이것으로 **매치는 된다**. 그런데 파서에게 넘길 것은 매치된 텍스트가 아니라
**이스케이프를 해석한 값**이다. `"a\nb"` 의 값은 5글자가 아니라 3글자다.

시작 조건을 쓰면 매치와 해석을 한 번에 끝낼 수 있다.

```c title="examples/04-lex-states/states.l (발췌)"
%x STR

%{
#define MAXSTR 1024
static char sbuf[MAXSTR];
static int  slen  = 0;
static int  sline = 0;

static void sput(char c) { if (slen < MAXSTR - 1) sbuf[slen++] = c; }
%}

%%

\"                  { slen = 0; sline = yylineno; BEGIN(STR); }

<STR>\"             { sbuf[slen] = '\0'; BEGIN(INITIAL); /* 완성된 값 사용 */ }
<STR>\\n            { sput('\n'); }
<STR>\\t            { sput('\t'); }
<STR>\\r            { sput('\r'); }
<STR>\\0            { sput('\0'); }
<STR>\\\\           { sput('\\'); }
<STR>\\\"           { sput('"');  }
<STR>\\.            { /* 알 수 없는 이스케이프 — 진단 후 글자 그대로 */
                      fprintf(stderr, "%d행: 알 수 없는 이스케이프 %s\n",
                              yylineno, yytext);
                      sput(yytext[1]); }
<STR>\n             { fprintf(stderr, "%d행: 문자열 안에 개행\n", sline);
                      BEGIN(INITIAL); }
<STR>[^\\"\n]+      { for (int i = 0; i < yyleng; i++) sput(yytext[i]); }
```

실행 결과:

```
$ ./states < tests/strings.in
   1  STRING   "hello<TAB>world<LF>"  (12바이트)
   2  STRING   "따옴표: " 역슬래시: \"  (28바이트)
   3  STRING   ""  (0바이트)
```

`\t`와 `\n`이 **실제 제어 문자로 해석되어** 값에 들어간 것을 볼 수 있다
(`<TAB>`, `<LF>`는 눈에 보이게 출력한 것이다).

:::tip[규칙 순서를 다시 확인하자]
`<STR>[^\\"\n]+` 가 **맨 아래**에 있다.
위로 올리면 어떻게 될까?

`\n` 이스케이프 입력에 대해 `\\n` 규칙(길이 2)과
`[^\\"\n]+` 규칙(`\`가 제외되어 있으므로 매치 실패)…
사실 이 경우는 안전하다. `[^\\"\n]`이 역슬래시를 제외했기 때문이다.

**역슬래시를 제외하지 않았다면** 최장 일치로 `[^"\n]+` 가
`\nabc` 전체를 삼켜 버려 이스케이프가 해석되지 않는다.
문자열 패턴에서 역슬래시를 제외하는 것이 핵심이다.
:::

---

## 9.5 EOF 처리

입력이 끝났는데 주석이나 문자열이 안 닫혔다면?
아무 규칙도 매치되지 않고 스캔이 그냥 끝난다 — **조용한 실패**다.

`<<EOF>>` 규칙으로 잡을 수 있다.

```c
<COMMENT><<EOF>>    {
                      fprintf(stderr, "%d행: 닫히지 않은 주석 (깊이 %d)\n",
                              cmt_start, depth);
                      BEGIN(INITIAL);
                      yyterminate();
                    }

<STR><<EOF>>        {
                      fprintf(stderr, "%d행: 닫히지 않은 문자열\n", sline);
                      BEGIN(INITIAL);
                      yyterminate();
                    }
```

```
$ ./states < tests/unclosed.in
   2  오류: 닫히지 않은 주석 (깊이 2)
----
단어 1개, 주석 0개, 문자열 0개, 오류 1개
```

시작 줄 번호(`cmt_start`)를 기억해 두었기에
**"어디서 시작된 주석이 안 닫혔는지"** 를 알려 줄 수 있다.
좋은 오류 메시지의 핵심이다.

:::caution[`<<EOF>>` 액션에서는 반드시 상태를 정리하자]
`BEGIN(INITIAL)`을 하지 않으면, 다음 파일을 스캔할 때
여전히 `COMMENT` 조건에서 시작한다.
`yyterminate()` 없이 반환하면 무한 루프가 될 수도 있다.
:::

---

## 9.6 여러 파일 처리

### `yywrap()`

입력이 끝나면 flex가 `yywrap()`을 부른다.

- **0을 반환** → "다른 파일을 이어서 읽겠다". 스캔이 계속된다
- **1을 반환** → "여기서 끝". `yylex()`가 0을 반환하고 종료

```c
static char **files;      /* 남은 파일 목록 */

int yywrap(void)
{
    if (*files == NULL) return 1;       /* 더 없다 */
    fclose(yyin);
    yyin = fopen(*files++, "r");
    if (yyin == NULL) return 1;
    yylineno = 1;
    return 0;                            /* 계속 */
}
```

`%option noyywrap` 을 쓰면 flex가 `yywrap()`이 항상 1을 반환한다고 가정한다.
파일 하나만 다루는 예제에서는 이쪽이 편하다.

### 버퍼 상태 — `#include` 구현

`#include` 는 **파일 중간에 다른 파일을 끼워 넣는** 것이므로
`yywrap()`으로는 안 된다. 버퍼 스택을 써야 한다.

```c
%option stack
%x INCL

%{
#define MAX_DEPTH 16
static YY_BUFFER_STATE stack[MAX_DEPTH];
static int sp = 0;
%}

%%

"#include"[ \t]*\"      { BEGIN(INCL); }

<INCL>[^"]+\"           {
    yytext[yyleng - 1] = '\0';           /* 닫는 따옴표 제거 */
    if (sp >= MAX_DEPTH) {
        fprintf(stderr, "include 중첩이 너무 깊다\n");
        exit(1);
    }
    stack[sp++] = YY_CURRENT_BUFFER;
    FILE *f = fopen(yytext, "r");
    if (!f) { fprintf(stderr, "열 수 없음: %s\n", yytext); exit(1); }
    yy_switch_to_buffer(yy_create_buffer(f, YY_BUF_SIZE));
    BEGIN(INITIAL);
}

<<EOF>> {
    if (--sp < 0) {
        yyterminate();                   /* 최상위 파일도 끝났다 */
    } else {
        yy_delete_buffer(YY_CURRENT_BUFFER);
        yy_switch_to_buffer(stack[sp]);  /* 부모 파일로 복귀 */
    }
}
```

| 함수 | 하는 일 |
|---|---|
| `yy_create_buffer(f, size)` | 파일에 대한 새 버퍼 생성 |
| `yy_switch_to_buffer(b)` | 그 버퍼로 전환 |
| `yy_delete_buffer(b)` | 버퍼 해제 |
| `yy_scan_string(s)` | **문자열**을 입력으로 삼는 버퍼 생성 |
| `yy_scan_bytes(p, n)` | 바이트 배열을 입력으로 |
| `YY_CURRENT_BUFFER` | 현재 버퍼 |

:::tip[테스트에는 `yy_scan_string`이 편하다]
```c
YY_BUFFER_STATE b = yy_scan_string("if (x) y = 1;");
yylex();
yy_delete_buffer(b);
```
임시 파일을 만들지 않고 단위 테스트를 쓸 수 있다.
:::

---

## 9.7 위치 추적

좋은 오류 메시지에는 **줄과 열**이 모두 필요하다.

### 줄 번호

`%option yylineno` 만 켜면 flex가 알아서 유지한다.

:::caution[`yylineno`에는 성능 비용이 있다]
flex가 매치할 때마다 `yytext` 안의 개행을 센다.
성능이 중요하고 개행이 특정 규칙에서만 나온다면,
직접 세는 편이 빠르다.
```c
\n      { yylineno++; }
```
:::

### 열 번호

flex가 자동으로 해 주지 않으므로 직접 센다.

```c
%{
int yycolumn = 1;

/* 모든 규칙의 액션 앞에 삽입되는 매크로 */
#define YY_USER_ACTION                        \
    yylloc.first_line   = yylineno;           \
    yylloc.first_column = yycolumn;           \
    yylloc.last_line    = yylineno;           \
    yylloc.last_column  = yycolumn + yyleng - 1;  \
    yycolumn += yyleng;
%}

%%
\n      { yycolumn = 1; }
```

`YY_USER_ACTION` 은 **모든 액션 직전에 실행되는 코드**다.
`yylloc` 은 bison의 `%locations` 가 만들어 주는 위치 구조체다.

### 오류 메시지에 원문 보여 주기

```
error: 인식할 수 없는 문자 '@'
  --> input.c:2:3
   |
 2 | a @ b
   |   ^
```

이런 형태의 메시지를 만들려면 원본 줄을 보관해야 한다.
간단한 방법은 파일 전체를 메모리에 읽어 두고
줄 시작 오프셋 배열을 유지하는 것이다.

:::note[좋은 진단이 언어의 인상을 결정한다]
Rust와 Elm이 "친절한 컴파일러"로 평가받는 이유의 상당 부분이
이 진단 형식에 있다. 어휘 분석기 단계부터 위치 정보를 정확히
챙겨 두어야 나중에 이런 메시지를 만들 수 있다.
:::

---

## 9.8 흔한 실수 모음

### ① 패턴을 들여썼다

```c
%%
    {id}    { return ID; }      /* ❌ C 코드로 복사된다 */
{id}        { return ID; }      /* ✅ */
```

### ② 규칙부 1열에 주석을 썼다

```c
%%
/* 이건 안 된다 */             /* ❌ lex 가 패턴으로 읽으려 한다 */
 /* 한 칸 들여쓰면 된다 */      /* ✅ */
```

### ③ `+` 대신 `*`

```c
[0-9]*      { return NUM; }     /* ❌ 빈 문자열도 매치 → 무한 루프 */
[0-9]+      { return NUM; }     /* ✅ */
```

빈 문자열이 매치되면 입력 위치가 전진하지 않아 영원히 같은 자리를 돈다.

### ④ 예약어를 식별자 뒤에 썼다

```c
{id}    { return ID; }
"if"    { return IF; }          /* ❌ 도달 불가. flex 가 경고한다 */
```

### ⑤ `yytext`를 복사하지 않았다

```c
{id}    { yylval.str = yytext;         return ID; }   /* ❌ */
{id}    { yylval.str = strdup(yytext); return ID; }   /* ✅ */
```

### ⑥ 정의부 참조에 괄호가 없다

```c
digit   [0-9]
num     {digit}+        /* flex 는 안전하지만 */
exp     [eE][+-]?{num}  /* 다른 lex 구현에서는 우선순위가 꼬일 수 있다 */

digits  ({digit}+)      /* ✅ 정의 자체를 괄호로 감싸 두면 안전하다 */
```

### ⑦ 시작 조건 안에 catch-all이 없다

```c
<COMMENT>"*/"   BEGIN(INITIAL);
/* ❌ 나머지 문자가 기본 규칙으로 출력된다 */
<COMMENT>.|\n   ;               /* ✅ */
```

### ⑧ `.` 이 개행을 포함한다고 착각

`.` 은 **개행을 제외한** 임의의 문자다.
여러 줄에 걸친 것을 매치하려면 `(.|\n)` 이나 `[^]` 를 써야 한다.

### ⑨ 블록 주석을 `"/*".*"*/"` 로 썼다

[4장에서 본](/docs/regular/regular-expressions#블록-주석의-함정) 함정이다.
최장 일치 때문에 `/*A*/ x /*B*/` 를 통째로 삼킨다.
시작 조건을 쓰자.

---

## 9.9 성능 관련 옵션

대부분의 경우 신경 쓸 필요가 없지만, 알아 두면 유용하다.

| 옵션 | 효과 |
|---|---|
| `-Cf` | 전이표를 압축하지 않는다. **가장 빠름**, 표가 커진다 |
| `-CF` | `-Cf` + 완전 표. 더 빠르고 더 큼 |
| `-Ca` | 표를 워드 정렬 |
| `-Ce` | 동등 클래스 사용 (기본값) |
| `-Cm` | 메타 동등 클래스 (기본값) |
| `-Cr` | `read()` 를 직접 쓴다 (stdio 우회) |
| `%option fast` | `-Cfr` 과 같다 |
| `%option full` | `-CFr` 과 같다 |

```bash
flex -Cf -o fast.c scanner.l    # 속도 우선
flex -Cem -o small.c scanner.l  # 크기 우선 (기본값)
```

:::tip[측정 없이 최적화하지 말 것]
실제 컴파일러에서 어휘 분석이 차지하는 시간은 보통 전체의 몇 퍼센트다.
`-Cf` 로 스캐너를 2배 빠르게 만들어도 전체는 1~2%밖에 안 빨라진다.

측정해서 병목임이 확인된 다음에 손대자.
그전에는 **읽기 쉬운 규칙**이 훨씬 가치 있다.
:::

---

## 9.10 실습 과제

`04-lex-states` 예제를 확장해 보자.

**과제 1 — 문자 상수**
`'a'`, `'\n'`, `'\\'` 같은 문자 상수를 처리하는 시작 조건 `CHR`를 추가하고,
`'ab'` 처럼 두 글자 이상이면 오류를 내라.

**과제 2 — Raw 문자열**
`R"(...)"` 형태의 raw 문자열(이스케이프 해석 없음)을 추가하라.

**과제 3 — 중첩 깊이 제한**
주석 중첩 깊이가 32를 넘으면 오류를 내라.
왜 이런 제한이 실무적으로 필요한지도 함께 생각해 보라.

**과제 4 — 열 번호**
`YY_USER_ACTION` 으로 열 번호를 추적하고, 오류 메시지에
`행:열` 형식으로 표시하라.

**과제 5 — 도구와 비교**
`flex -v` 로 시작 조건을 쓴 버전과 정규 표현 하나로 쓴 버전의
DFA 상태 수를 비교하라. 어느 쪽이 큰가? 왜인가?

---

## 요약

- **시작 조건**은 스캐너에 모드를 준다.
  거의 언제나 배타적 `%x` 를 쓴다 (`%s` 는 조건 없는 규칙도 함께 적용된다).
- **중첩 주석**은 정규언어가 아니므로 **카운터 변수**가 반드시 필요하다.
  이는 편법이 아니라 lex가 전제한 분업이다.
- **문자열 리터럴**은 시작 조건으로 처리하면
  매치와 **이스케이프 해석**을 한 번에 끝낼 수 있다.
  패턴에서 **역슬래시를 제외**하는 것이 핵심이다.
- `<<EOF>>` 규칙으로 닫히지 않은 주석·문자열을 진단한다.
  **시작 줄 번호를 기억**해 두면 훨씬 좋은 메시지가 된다.
- 여러 파일은 `yywrap()`, `#include` 는 **버퍼 스택**으로 처리한다.
- 위치 추적은 `%option yylineno` + `YY_USER_ACTION` 조합.
- `%option warn nodefault` 를 켜서 기본 규칙의 조용한 실패를 막자.
- 주석 본문은 `[^*/\n]+` 처럼 **크게 삼키는 규칙**으로 성능을 확보한다.

## 확인 문제

1. `%s`와 `%x`의 차이를 설명하고, `%s`가 적절한 경우를 하나 들라.
2. 중첩 주석에 카운터가 필요한 이유를 3장의 펌핑 보조정리와 연결해 설명하라.
3. 문자열 패턴 `[^"\n]+` (역슬래시 미제외)를 쓰면
   `"a\"b"` 가 어떻게 잘못 처리되는지 단계별로 보여라.
4. `<<EOF>>` 액션에서 `BEGIN(INITIAL)`을 빼먹으면
   여러 파일을 처리할 때 어떤 버그가 생기는가?
5. `#include` 를 `yywrap()` 으로 구현할 수 없는 이유는?
6. 다음 규칙이 왜 위험한지 설명하라.
   ```c
   <COMMENT>.    { }
   ```
   (힌트: 성능과 개행)

---

3부가 끝났다. 여기까지가 **어휘 분석**이다.

지금 우리는 소스 텍스트를 토큰 스트림으로 바꿀 수 있다.
그러나 토큰들이 **올바른 구조를 이루는지**는 아직 검사하지 못한다.
괄호가 맞는지, `if` 뒤에 조건식이 오는지 —
이것들은 정규언어의 능력 밖이다.

4부에서는 **문맥 자유 문법**과 **구문 분석**으로 넘어간다.
