/* wordcount.l — flex 로 만드는 wc(1) 흉내
 *
 * 이 예제가 보여 주는 것
 *   - lex 입력 파일의 세 부분 구조 (정의 / 규칙 / 사용자 코드)
 *   - 규칙은 "패턴 { 액션 }" 의 나열이라는 것
 *   - yytext / yyleng 로 매치된 문자열에 접근하는 방법
 *   - 어떤 입력도 놓치지 않도록 규칙을 배치하는 방법
 *
 *   flex -o wordcount.c wordcount.l && cc -o wordcount wordcount.c
 */

%option noyywrap
%option noinput nounput

%{
#include <stdio.h>

static long chars = 0;
static long words = 0;
static long lines = 0;
%}

/* 정규 정의 — 규칙부에서 {word} 로 참조한다 */
word    [^ \t\n]+

%%

{word}      { words++; chars += yyleng; }
\n          { lines++; chars++; }
[ \t]       { chars++; }

%%

int main(void)
{
    yylex();
    printf("lines=%ld words=%ld chars=%ld\n", lines, words, chars);
    return 0;
}
