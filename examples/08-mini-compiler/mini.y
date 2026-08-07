/* mini.y — 미니 언어의 문법과 AST 구성
 *
 * 언어
 *   program := decl* stmt*
 *   decl    := ("int" | "float") ID ("," ID)* ";"
 *   stmt    := ID "=" expr ";"
 *            | "if" "(" expr ")" stmt [ "else" stmt ]
 *            | "while" "(" expr ")" stmt
 *            | "print" expr ";"
 *            | "{" stmt* "}"
 *   expr    := 산술 · 관계 · 논리 연산 (C 와 같은 우선순위)
 *
 * 이 예제가 보여 주는 것
 *   - 액션에서 **AST를 조립**하는 법 ($$ = node_binop(...))
 *   - `%union` 에 포인터 타입 넣기
 *   - dangling else 가 만드는 **shift/reduce 충돌 1개**와 `%expect` 로의 문서화
 *   - `%destructor` 없이도 되는 만큼만 메모리를 다루기
 */

%{
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "mini.h"

Node *program_root;

/* 선언부에서 여러 이름을 모으기 위한 임시 저장소.
 *   int a, b, c;
 * 를 처리할 때 타입은 맨 앞에 한 번만 나오므로,
 * 이름들을 먼저 모아 두었다가 타입이 확정되면 한꺼번에 등록한다. */
#define MAXNAMES 32
static char *pending[MAXNAMES];
static int   pending_line[MAXNAMES];
static int   npending;

static void pending_add(char *name, int line)
{
    if (npending < MAXNAMES) {
        pending[npending] = name;
        pending_line[npending] = line;
        npending++;
    } else {
        free(name);
    }
}

static void pending_flush(Type t)
{
    for (int i = 0; i < npending; i++) {
        sym_declare(pending[i], t, pending_line[i]);
        free(pending[i]);
    }
    npending = 0;
}
%}

%union {
    long    ival;
    double  fval;
    char   *name;
    Node   *node;
    int     type;
}

%token <ival> INT_LIT
%token <fval> FLOAT_LIT
%token <name> ID
%token KW_INT KW_FLOAT KW_IF KW_ELSE KW_WHILE KW_PRINT
%token OP_LE OP_GE OP_EQ OP_NE OP_AND OP_OR

%type <node> stmt stmt_list block expr opt_else
%type <type> type

/* ── 우선순위 (C 를 따른다. 아래로 갈수록 높다) ────────── */
%left  OP_OR
%left  OP_AND
%left  OP_EQ OP_NE
%left  '<' '>' OP_LE OP_GE
%left  '+' '-'
%left  '*' '/' '%'
%right '!' UMINUS

/* dangling else 로 인한 shift/reduce 충돌 1개를 **의도적으로 남긴다**.
 * bison 은 기본적으로 shift 를 택하므로 else 는 가장 가까운 if 에 붙는다.
 * %expect 로 "이 충돌 1개는 알고 있다"고 선언해 두면
 * 그보다 많은 충돌이 생겼을 때만 bison 이 실패한다 — 회귀 방지 장치다. */
%expect 1

%%

program
    : decl_list stmt_list           { program_root = $2; }
    ;

/* ── 선언부 ─────────────────────────────────────────────── */

decl_list
    : /* 없음 */
    | decl_list decl
    ;

decl
    : type id_list ';'              { pending_flush((Type)$1); }
    ;

type
    : KW_INT                        { $$ = TY_INT; }
    | KW_FLOAT                      { $$ = TY_FLOAT; }
    ;

id_list
    : ID                            { pending_add($1, yylineno); }
    | id_list ',' ID                { pending_add($3, yylineno); }
    ;

/* ── 문장 ───────────────────────────────────────────────── */

stmt_list
    : /* 없음 */                    { $$ = NULL; }
    | stmt_list stmt                { $$ = node_seq($1, $2); }
    ;

block
    : '{' stmt_list '}'             { $$ = $2; }
    ;

stmt
    : ID '=' expr ';'               { $$ = node_assign($1, $3, yylineno); }
    | KW_PRINT expr ';'             { $$ = node_print($2, yylineno); }
    | KW_IF '(' expr ')' stmt opt_else
                                    { $$ = node_if($3, $5, $6, yylineno); }
    | KW_WHILE '(' expr ')' stmt    { $$ = node_while($3, $5, yylineno); }
    | block                         { $$ = $1; }
    | ';'                           { $$ = NULL; }
    | error ';'                     { $$ = NULL; yyerrok; }
    ;

/* 여기서 shift/reduce 충돌이 생긴다.
 * `if (a) if (b) S else T` 에서 else 를 보았을 때
 *   - opt_else → ε 로 축약해 바깥 if 에 붙이거나
 *   - KW_ELSE 를 이동해 안쪽 if 에 붙이거나
 * bison 은 **이동**을 택하므로 안쪽 if 에 붙는다. 우리가 원하는 결과다. */
opt_else
    : /* 없음 */                    { $$ = NULL; }
    | KW_ELSE stmt                  { $$ = $2; }
    ;

/* ── 식 ─────────────────────────────────────────────────── */

expr
    : INT_LIT                       { $$ = node_int($1, yylineno); }
    | FLOAT_LIT                     { $$ = node_float($1, yylineno); }
    | ID                            { $$ = node_var($1, yylineno); }
    | expr '+' expr                 { $$ = node_binop("+",  $1, $3, yylineno); }
    | expr '-' expr                 { $$ = node_binop("-",  $1, $3, yylineno); }
    | expr '*' expr                 { $$ = node_binop("*",  $1, $3, yylineno); }
    | expr '/' expr                 { $$ = node_binop("/",  $1, $3, yylineno); }
    | expr '%' expr                 { $$ = node_binop("%",  $1, $3, yylineno); }
    | expr '<' expr                 { $$ = node_binop("<",  $1, $3, yylineno); }
    | expr '>' expr                 { $$ = node_binop(">",  $1, $3, yylineno); }
    | expr OP_LE expr               { $$ = node_binop("<=", $1, $3, yylineno); }
    | expr OP_GE expr               { $$ = node_binop(">=", $1, $3, yylineno); }
    | expr OP_EQ expr               { $$ = node_binop("==", $1, $3, yylineno); }
    | expr OP_NE expr               { $$ = node_binop("!=", $1, $3, yylineno); }
    | expr OP_AND expr              { $$ = node_binop("&&", $1, $3, yylineno); }
    | expr OP_OR expr               { $$ = node_binop("||", $1, $3, yylineno); }
    | '-' expr %prec UMINUS         { $$ = node_neg($2, yylineno); }
    | '(' expr ')'                  { $$ = $2; }
    ;

%%

void yyerror(const char *s)
{
    fflush(stdout);
    fprintf(stderr, "%d행: 구문 오류 — %s\n", yylineno, s);
    sema_errors++;
}
