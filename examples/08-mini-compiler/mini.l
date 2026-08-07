/* mini.l — 미니 언어의 어휘 분석기 */

%option noyywrap
%option yylineno
%option noinput nounput

%{
#include <stdlib.h>
#include <string.h>
#include "mini.h"
#include "mini.tab.h"
%}

digit    [0-9]
letter   [A-Za-z_]
id       {letter}({letter}|{digit})*
int      {digit}+
float    {digit}+"."{digit}*([eE][+-]?{digit}+)?|{digit}+[eE][+-]?{digit}+

%x COMMENT

%%

 /* ── 버리는 것 ── */
[ \t\r\n]+          { }
"//"[^\n]*          { }
"/*"                { BEGIN(COMMENT); }
<COMMENT>"*/"       { BEGIN(INITIAL); }
<COMMENT>[^*\n]+    { }
<COMMENT>"*"        { }
<COMMENT>\n         { }
<COMMENT><<EOF>>    { fprintf(stderr, "닫히지 않은 주석\n"); yyterminate(); }

 /* ── 예약어 — 반드시 {id} 규칙보다 먼저 ── */
"int"               { return KW_INT;   }
"float"             { return KW_FLOAT; }
"if"                { return KW_IF;    }
"else"              { return KW_ELSE;  }
"while"             { return KW_WHILE; }
"print"             { return KW_PRINT; }

 /* ── 두 글자 연산자 (최장 일치가 알아서 골라 준다) ── */
"<="                { return OP_LE;  }
">="                { return OP_GE;  }
"=="                { return OP_EQ;  }
"!="                { return OP_NE;  }
"&&"                { return OP_AND; }
"||"                { return OP_OR;  }

 /* ── 리터럴과 식별자 ── */
{float}             { yylval.fval = atof(yytext);  return FLOAT_LIT; }
{int}               { yylval.ival = atol(yytext);  return INT_LIT;   }
{id}                { yylval.name = strdup(yytext); return ID;       }

 /* ── 한 글자 토큰 ── */
[-+*/%<>=!(){};,]   { return yytext[0]; }

 /* ── catch-all ── */
.                   {
                      fflush(stdout);
                      fprintf(stderr, "%d행: 인식할 수 없는 문자 '%s'\n",
                              yylineno, yytext);
                      sema_errors++;
                    }

%%
