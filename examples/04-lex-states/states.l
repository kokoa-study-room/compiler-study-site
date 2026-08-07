/* states.l — 시작 조건(start condition)으로 정규 표현의 한계를 넘기
 *
 * 이 예제가 보여 주는 것
 *   - `%x` 배타적 시작 조건과 `BEGIN(...)` 으로 스캐너에 "모드"를 주는 법
 *   - **중첩 블록 주석** — 정규언어가 아니므로 카운터 변수가 반드시 필요하다
 *   - **문자열 리터럴** — 이스케이프를 해석하며 값을 누적하는 법
 *   - `<<EOF>>` 로 "닫히지 않은 주석/문자열"을 진단하는 법
 *   - 시작 조건 안에서도 catch-all 규칙이 필요하다는 것
 *
 *   flex -o states.c states.l && cc -o states states.c
 */

%option noyywrap
%option yylineno
%option noinput nounput

%x COMMENT
%x STR

%{
#include <stdio.h>
#include <string.h>

#define MAXSTR 1024

static int  depth       = 0;    /* 현재 주석 중첩 깊이 */
static int  max_depth   = 0;    /* 관측된 최대 깊이 */
static int  cmt_start   = 0;    /* 주석이 시작된 줄 */
static long n_comments  = 0;
static long n_strings   = 0;
static long n_words     = 0;
static long n_errors    = 0;

static char sbuf[MAXSTR];
static int  slen  = 0;
static int  sline = 0;

static void sput(char c)
{
    if (slen < MAXSTR - 1) sbuf[slen++] = c;
}

/* 제어 문자를 눈에 보이게 바꿔 출력한다 */
static void print_visible(const char *s, int n)
{
    for (int i = 0; i < n; i++) {
        switch (s[i]) {
        case '\n': fputs("<LF>",  stdout); break;
        case '\t': fputs("<TAB>", stdout); break;
        case '\r': fputs("<CR>",  stdout); break;
        case '\0': fputs("<NUL>", stdout); break;
        default:   putchar(s[i]);          break;
        }
    }
}
%}

word    [A-Za-z_][A-Za-z0-9_]*

%%

 /* ══ INITIAL — 보통 상태 ══════════════════════════════ */

"/*"        { depth = 1; max_depth = 1; cmt_start = yylineno; BEGIN(COMMENT); }

\"          { slen = 0; sline = yylineno; BEGIN(STR); }

{word}      { n_words++; }
[ \t\r\n]+  { /* 공백 */ }
.           { /* 그 밖의 문자는 이 예제의 관심사가 아니다 */ }


 /* ══ COMMENT — 중첩 블록 주석 ═════════════════════════
  *
  * 여기서 `depth` 라는 **정수 변수**를 쓰는 순간, 이 스캐너는 더 이상
  * 순수한 유한 오토마타가 아니다. 중첩 괄호 맞추기는 정규언어가 아니므로
  * 이것은 이론적으로 불가피한 타협이다.
  */
<COMMENT>"/*"       { depth++; if (depth > max_depth) max_depth = depth; }
<COMMENT>"*/"       {
                      if (--depth == 0) {
                          n_comments++;
                          printf("%4d  COMMENT  %d~%d줄, 최대 중첩 깊이 %d\n",
                                 cmt_start, cmt_start, yylineno, max_depth);
                          BEGIN(INITIAL);
                      }
                    }
<COMMENT>[^*/\n]+   { /* 주석 본문 — 한 번에 크게 삼켜 성능을 올린다 */ }
<COMMENT>"*"        { /* '*' 하나만 있는 경우 */ }
<COMMENT>"/"        { /* '/' 하나만 있는 경우 */ }
<COMMENT>\n         { /* yylineno 자동 증가 */ }
<COMMENT><<EOF>>    {
                      n_errors++;
                      fflush(stdout);
                      fprintf(stderr, "%4d  오류: 닫히지 않은 주석 (깊이 %d)\n",
                              cmt_start, depth);
                      BEGIN(INITIAL);
                      yyterminate();
                    }


 /* ══ STR — 문자열 리터럴 ══════════════════════════════
  *
  * 4장에서 본 정규 표현 \"([^"\\\n]|\\.)*\" 하나로도 매치는 되지만,
  * 시작 조건을 쓰면 이스케이프를 **해석한 값**을 그때그때 누적할 수 있다.
  * 매치와 해석을 한 번에 끝내는 셈이다.
  */
<STR>\"             {
                      sbuf[slen] = '\0';
                      n_strings++;
                      printf("%4d  STRING   \"", sline);
                      print_visible(sbuf, slen);
                      printf("\"  (%d바이트)\n", slen);
                      BEGIN(INITIAL);
                    }
<STR>\\n            { sput('\n'); }
<STR>\\t            { sput('\t'); }
<STR>\\r            { sput('\r'); }
<STR>\\0            { sput('\0'); }
<STR>\\\\           { sput('\\'); }
<STR>\\\"           { sput('"');  }
<STR>\\.            {
                      n_errors++;
                      fflush(stdout);
                      fprintf(stderr, "%4d  오류: 알 수 없는 이스케이프 %s\n",
                              yylineno, yytext);
                      sput(yytext[1]);
                    }
<STR>\n             {
                      n_errors++;
                      fflush(stdout);
                      fprintf(stderr, "%4d  오류: 문자열 안에 개행\n", sline);
                      BEGIN(INITIAL);
                    }
<STR>[^\\"\n]+      { for (int i = 0; i < yyleng; i++) sput(yytext[i]); }
<STR><<EOF>>        {
                      n_errors++;
                      fflush(stdout);
                      fprintf(stderr, "%4d  오류: 닫히지 않은 문자열\n", sline);
                      BEGIN(INITIAL);
                      yyterminate();
                    }

%%

int main(void)
{
    yylex();
    printf("----\n");
    printf("단어 %ld개, 주석 %ld개, 문자열 %ld개, 오류 %ld개\n",
           n_words, n_comments, n_strings, n_errors);
    return n_errors == 0 ? 0 : 1;
}
