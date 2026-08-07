/* calc.l — 계산기의 어휘 분석기
 *
 * 파서와의 계약 세 가지가 모두 드러나 있다.
 *   1. 토큰 코드 — calc.tab.h 의 상수를 return 한다
 *   2. 의미 값   — yylval 에 담아 넘긴다
 *   3. 입력 끝   — 0 을 반환한다 (noyywrap 이면 자동)
 */

%option noyywrap
%option noinput nounput

/* yylineno 는 쓰지 않는다 — 줄 번호는 파서가 센다(calc.y 의 주석 참고) */

%{
#include <stdlib.h>
#include <string.h>
#include "calc.tab.h"     /* bison -d 가 생성한다. 반드시 먼저 만들어져야 한다 */
%}

digit    [0-9]
letter   [A-Za-z_]
number   {digit}+("."{digit}*)?([eE][+-]?{digit}+)?
id       {letter}({letter}|{digit})*

%%

{number}        { yylval.num = atof(yytext); return NUM; }
{id}            { yylval.str = strdup(yytext); return ID; }

"\n"            { return EOL; }
[ \t\r]+        { /* 공백은 버린다 */ }
"#"[^\n]*       { /* 주석 */ }

 /* 연산자와 구두점은 문자 코드를 그대로 반환한다.
  * yacc 는 0~255 를 문자 하나짜리 토큰으로 예약해 두었다. */
[-+*/%^()=]     { return yytext[0]; }

.               {
                  fprintf(stderr, "%d행: 인식할 수 없는 문자 '%s'\n",
                          yylineno, yytext);
                }

%%
