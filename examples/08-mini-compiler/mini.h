/* mini.h — 미니 언어 컴파일러의 공용 선언
 *
 * 구성
 *   mini.l  어휘 분석기      (flex)
 *   mini.y  구문 분석기 + AST 구성 (bison)
 *   mini.c  심볼 테이블 · 타입 검사 · 3-주소 코드 생성
 *   mini.h  이 파일
 */

#ifndef MINI_H
#define MINI_H

#include <stdio.h>

/* ══ 타입 ══════════════════════════════════════════════════ */
typedef enum { TY_ERROR = 0, TY_INT, TY_FLOAT, TY_VOID } Type;

const char *type_name(Type t);

/* ══ AST ═══════════════════════════════════════════════════ */
typedef enum {
    /* 식 */
    N_INT_LIT, N_FLOAT_LIT, N_VAR, N_BINOP, N_NEG, N_CONV,
    /* 문장 */
    N_ASSIGN, N_IF, N_WHILE, N_SEQ, N_PRINT, N_EMPTY
} NodeKind;

typedef struct Node {
    NodeKind kind;
    Type     type;        /* 의미 분석이 채운다 */
    int      line;

    long        ival;     /* N_INT_LIT */
    double      fval;     /* N_FLOAT_LIT */
    char       *name;     /* N_VAR, N_ASSIGN */
    const char *op;       /* N_BINOP: "+", "<", "&&" … */

    struct Node *a, *b, *c;  /* 자식. 노드 종류마다 의미가 다르다 */
} Node;

Node *node_new(NodeKind kind, int line);
Node *node_int(long v, int line);
Node *node_float(double v, int line);
Node *node_var(char *name, int line);
Node *node_binop(const char *op, Node *l, Node *r, int line);
Node *node_neg(Node *e, int line);
Node *node_assign(char *name, Node *e, int line);
Node *node_if(Node *cond, Node *then_s, Node *else_s, int line);
Node *node_while(Node *cond, Node *body, int line);
Node *node_seq(Node *first, Node *rest);
Node *node_print(Node *e, int line);
void  node_free(Node *n);
void  node_dump(const Node *n, int indent);

/* ══ 심볼 테이블 ═══════════════════════════════════════════ */
int   sym_declare(const char *name, Type t, int line);  /* 0 = 실패(중복) */
Type  sym_lookup(const char *name);                     /* TY_ERROR = 미선언 */
void  sym_dump(void);

/* ══ 의미 분석 · 코드 생성 ═════════════════════════════════ */
void check_program(Node *root);
void gen_program(Node *root);

/* ══ 진단 ══════════════════════════════════════════════════ */
extern int sema_errors;
void semantic_error(int line, const char *fmt, ...);

/* ══ 파서 인터페이스 ═══════════════════════════════════════ */
extern Node *program_root;
extern int   yylineno;
int  yylex(void);
int  yyparse(void);
void yyerror(const char *s);

#endif /* MINI_H */
