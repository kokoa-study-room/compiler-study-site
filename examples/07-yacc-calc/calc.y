/* calc.y — flex + bison 으로 만드는 계산기
 *
 * 이 예제가 보여 주는 것
 *   - yacc 입력 파일의 3부 구조 (선언 / 규칙 / 사용자 코드)
 *   - `%union` 과 `%token <..>` / `%type <..>` 로 의미 값에 타입 주기
 *   - **모호한 문법 + 우선순위 선언**이라는 실용적 접근
 *     (14장에서 손으로 계층화했던 E/T/F 대신)
 *   - `%left` / `%right` / `%nonassoc` / `%prec` 의 효과
 *   - `error` 토큰을 이용한 패닉 모드 오류 복구
 *   - 심볼 테이블을 액션 코드에서 다루기
 *
 * 빌드
 *   bison -d -o calc.tab.c calc.y
 *   flex  -o lex.yy.c calc.l
 *   cc -o calc calc.tab.c lex.yy.c
 *
 * 문법이 **모호하다**는 점에 주목하자.
 *   expr : expr '+' expr | expr '*' expr | ...
 * 이대로면 shift/reduce 충돌이 잔뜩 생기지만,
 * %left 선언이 전부 해결해 주므로 bison 은 충돌 0개를 보고한다.
 */

%{
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

int  yylex(void);
void yyerror(const char *s);

/* 줄 번호를 파서가 직접 센다.
 *
 * flex 의 yylineno 는 '\n' 을 매치하는 **즉시** 증가한다. 그런데 그 '\n'(EOL)은
 * 파서가 lookahead 로 먼저 읽어 두므로, `expr '/' expr` 같은 안쪽 축약이
 * 실행되는 시점에 yylineno 는 이미 다음 줄을 가리킨다.
 * 그래서 한 줄을 다 처리한 뒤(=line 규칙의 액션에서) 우리가 직접 올린다. */
static int lineno = 1;

/* ── 아주 작은 심볼 테이블 ─────────────────────────────── */
#define MAXVARS 64

static struct { char name[32]; double value; int defined; } vars[MAXVARS];
static int nvars;

static int lookup(const char *name)
{
    for (int i = 0; i < nvars; i++)
        if (strcmp(vars[i].name, name) == 0) return i;
    return -1;
}

static int intern(const char *name)
{
    int i = lookup(name);
    if (i >= 0) return i;
    if (nvars >= MAXVARS) { yyerror("변수가 너무 많다"); return 0; }
    snprintf(vars[nvars].name, sizeof vars[nvars].name, "%s", name);
    vars[nvars].value = 0;
    vars[nvars].defined = 0;
    return nvars++;
}

static int nerrors;
%}

/* ── 의미 값의 타입 ────────────────────────────────────
 * 15장에서 본 "값 스택"의 원소 타입이 바로 이 공용체다.
 */
%union {
    double  num;
    char   *str;
}

%token <num> NUM
%token <str> ID
%token       EOL

%type  <num> expr

/* ── 우선순위와 결합성 ─────────────────────────────────
 * **아래로 갈수록 우선순위가 높다.**
 * 이 선언들이 모호한 문법의 shift/reduce 충돌을 전부 해소한다.
 */
%right '='
%left  '+' '-'
%left  '*' '/' '%'
%right UMINUS       /* 단항 마이너스용 가짜 토큰 */
%right '^'          /* 거듭제곱은 우결합: 2^3^2 = 2^(3^2) */

/* UMINUS 를 '^' 보다 **아래**(낮은 우선순위)에 둔 것이 중요하다.
 *   -2^2  →  -(2^2) = -4   ('^' 가 더 높으므로 shift)
 *   -2*3  →  (-2)*3 = -6   (UMINUS 가 더 높으므로 reduce)
 * 수학 관례와 파이썬(-2**2 == -4)이 이 결합을 따른다. */

%%

/* ══ 규칙부 ══════════════════════════════════════════════ */

input
    : /* 빈 입력 */
    | input line
    ;

line
    : EOL                   { lineno++; }
    | expr EOL              { printf("  = %g\n", $1); lineno++; }
    | ID '=' expr EOL       {
                              int i = intern($1);
                              vars[i].value = $3;
                              vars[i].defined = 1;
                              printf("  %s = %g\n", vars[i].name, $3);
                              free($1);
                              lineno++;
                            }
    /* 패닉 모드 오류 복구: 줄 끝까지 버리고 다음 줄부터 재개한다.
     * error 는 bison 이 미리 정의해 둔 특별한 토큰이다. */
    | error EOL             { yyerrok; lineno++; }
    ;

expr
    : NUM                   { $$ = $1; }
    | ID                    {
                              int i = lookup($1);
                              if (i < 0 || !vars[i].defined) {
                                  fflush(stdout);
                                  fprintf(stderr, "%d행: 정의되지 않은 변수 '%s'\n",
                                          lineno, $1);
                                  nerrors++;
                                  $$ = 0;
                              } else {
                                  $$ = vars[i].value;
                              }
                              free($1);
                            }
    | expr '+' expr         { $$ = $1 + $3; }
    | expr '-' expr         { $$ = $1 - $3; }
    | expr '*' expr         { $$ = $1 * $3; }
    | expr '/' expr         {
                              if ($3 == 0) {
                                  fflush(stdout);
                                  fprintf(stderr, "%d행: 0으로 나눌 수 없다\n", lineno);
                                  nerrors++;
                                  $$ = 0;
                              } else {
                                  $$ = $1 / $3;
                              }
                            }
    | expr '%' expr         { $$ = fmod($1, $3); }
    | expr '^' expr         { $$ = pow($1, $3); }
    /* %prec UMINUS 가 없으면 이 규칙의 우선순위는 마지막 터미널인 '-' 를
     * 따라가서 이항 뺄셈과 같아진다. 그러면 -2^2 가 (-2)^2 로 해석된다. */
    | '-' expr %prec UMINUS { $$ = -$2; }
    | '(' expr ')'          { $$ = $2; }
    ;

%%

/* ══ 사용자 코드부 ═══════════════════════════════════════ */

void yyerror(const char *s)
{
    nerrors++;
    fflush(stdout);
    fprintf(stderr, "%d행: %s\n", lineno, s);
}

int main(void)
{
    yyparse();
    printf("----\n");
    if (nerrors == 0) printf("오류 없음\n");
    else              printf("오류 %d건\n", nerrors);
    return nerrors == 0 ? 0 : 1;
}
