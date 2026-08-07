/* tokenizer.l — C 부분집합의 어휘 분석기
 *
 * 이 예제가 보여 주는 것
 *   - 정규 정의로 패턴을 쌓아 올리는 법
 *   - **최장 일치**: "==" 가 "=" 두 개로 쪼개지지 않는다
 *   - **규칙 순서**: 예약어 규칙을 식별자 규칙보다 먼저 써야 하는 이유
 *   - 공백과 주석을 버리는 법
 *   - 어떤 패턴에도 맞지 않는 문자를 오류로 보고하는 법
 *   - yylineno 로 줄 번호를 추적하는 법
 *
 *   flex -o tokenizer.c tokenizer.l && cc -o tokenizer tokenizer.c
 */

%option noyywrap
%option yylineno
%option noinput nounput

%{
#include <stdio.h>

static long ntokens = 0;
static long nerrors = 0;

static void emit(const char *type, const char *text)
{
    ntokens++;
    printf("%4d  %-10s %s\n", yylineno, type, text);
}
%}

/* ── 정규 정의 ─────────────────────────────────────────── */
letter      [A-Za-z_]
digit       [0-9]
hexdigit    [0-9A-Fa-f]

id          {letter}({letter}|{digit})*
dec         0|[1-9]{digit}*
hex         0[xX]{hexdigit}+
oct         0[0-7]+
exponent    [eE][+-]?{digit}+
float       {digit}+"."{digit}*{exponent}?|{digit}+{exponent}

/* 이스케이프를 허용하되 개행은 허용하지 않는 문자열/문자 상수 */
strlit      \"([^"\\\n]|\\.)*\"
charlit     '([^'\\\n]|\\.)'

ws          [ \t\r]+
linecmt     "//"[^\n]*
blockcmt    "/*"([^*]|"*"+[^*/])*"*"+"/"

%%

 /* ── 1. 버리는 것들 ────────────────────────────────────
  * 먼저 써도 되고 나중에 써도 되지만, 앞에 두면 "무엇을 무시하는지"가
  * 파일 첫머리에 드러나서 읽기 좋다.
  */
{ws}            { /* 공백은 버린다 */ }
\n              { /* yylineno 는 flex 가 알아서 증가시킨다 */ }
{linecmt}       { /* 한 줄 주석 */ }
{blockcmt}      { /* 블록 주석 */ }

 /* ── 2. 예약어 ────────────────────────────────────────
  * 반드시 {id} 규칙보다 **먼저** 와야 한다.
  * "int" 는 {id} 에도 맞고 "int" 에도 맞는데, 길이가 같으면
  * flex 는 **먼저 쓰인 규칙**을 택하기 때문이다.
  */
"int"|"char"|"float"|"void"     { emit("KEYWORD", yytext); }
"if"|"else"|"while"|"for"       { emit("KEYWORD", yytext); }
"return"|"break"|"continue"     { emit("KEYWORD", yytext); }

 /* ── 3. 식별자와 리터럴 ───────────────────────────────── */
{id}            { emit("ID",     yytext); }
{float}         { emit("FLOAT",  yytext); }
{hex}           { emit("HEX",    yytext); }
{oct}           { emit("OCT",    yytext); }
{dec}           { emit("INT",    yytext); }
{strlit}        { emit("STRING", yytext); }
{charlit}       { emit("CHAR",   yytext); }

 /* ── 4. 연산자 ────────────────────────────────────────
  * 두 글자 연산자를 한 글자보다 먼저 쓸 필요는 없다.
  * 최장 일치 규칙이 알아서 "==" 를 고른다.
  * 그래도 읽는 사람을 위해 긴 것부터 적어 두는 관례를 따른다.
  */
"=="|"!="|"<="|">="             { emit("RELOP", yytext); }
"&&"|"||"                       { emit("LOGOP", yytext); }
"++"|"--"                       { emit("INCDEC", yytext); }
"+="|"-="|"*="|"/="             { emit("ASSIGNOP", yytext); }
"<"|">"                         { emit("RELOP", yytext); }
"+"|"-"|"*"|"/"|"%"             { emit("ARITHOP", yytext); }
"="                             { emit("ASSIGN", yytext); }
"!"                             { emit("NOT", yytext); }

 /* ── 5. 구두점 ────────────────────────────────────────── */
[(){}\[\];,]    { emit("PUNCT", yytext); }

 /* ── 6. 그 밖의 모든 것 ────────────────────────────────
  * 이 규칙이 없으면 flex 의 기본 규칙(입력을 그대로 출력)이 작동해
  * 오류를 조용히 지나친다. 반드시 catch-all 을 두자.
  */
.               {
                  nerrors++;
                  /* 진단은 표준 오류로 내보내되, 표준 출력과 순서가 뒤섞이지
                   * 않도록 먼저 flush 한다. (그러지 않으면 stdout 은 버퍼링되고
                   * stderr 는 즉시 나가서 오류 줄이 전부 앞으로 몰린다.) */
                  fflush(stdout);
                  fprintf(stderr, "%4d  오류: 인식할 수 없는 문자 '%s'\n",
                          yylineno, yytext);
                }

%%

int main(void)
{
    yylex();
    printf("----\n토큰 %ld개, 오류 %ld개\n", ntokens, nerrors);
    return nerrors == 0 ? 0 : 1;
}
