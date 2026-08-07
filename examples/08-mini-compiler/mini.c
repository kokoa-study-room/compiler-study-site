/* mini.c — AST · 심볼 테이블 · 타입 검사 · 3-주소 코드 생성
 *
 * 파서(mini.y)가 AST 를 만들어 주면, 여기서
 *   ① 의미 분석 — 선언 검사와 타입 검사, 필요한 형 변환 노드 삽입
 *   ② 코드 생성 — 3-주소 코드 출력
 * 두 패스를 돌린다.
 *
 * 1장에서 본 컴파일러 단계 중 ③ 의미 분석과 ④ 중간 코드 생성에 해당한다.
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <string.h>
#include "mini.h"

int sema_errors;

/* ══ 타입 ══════════════════════════════════════════════════ */

const char *type_name(Type t)
{
    switch (t) {
    case TY_INT:   return "int";
    case TY_FLOAT: return "float";
    case TY_VOID:  return "void";
    default:       return "<오류>";
    }
}

void semantic_error(int line, const char *fmt, ...)
{
    va_list ap;
    sema_errors++;
    fflush(stdout);
    fprintf(stderr, "%d행: ", line);
    va_start(ap, fmt);
    vfprintf(stderr, fmt, ap);
    va_end(ap);
    fputc('\n', stderr);
}

/* ══ AST 생성자 ════════════════════════════════════════════ */

Node *node_new(NodeKind kind, int line)
{
    Node *n = calloc(1, sizeof *n);
    if (!n) { fprintf(stderr, "메모리 부족\n"); exit(2); }
    n->kind = kind;
    n->line = line;
    n->type = TY_ERROR;
    return n;
}

Node *node_int(long v, int line)
{
    Node *n = node_new(N_INT_LIT, line);
    n->ival = v; n->type = TY_INT;
    return n;
}

Node *node_float(double v, int line)
{
    Node *n = node_new(N_FLOAT_LIT, line);
    n->fval = v; n->type = TY_FLOAT;
    return n;
}

Node *node_var(char *name, int line)
{
    Node *n = node_new(N_VAR, line);
    n->name = name;
    return n;
}

Node *node_binop(const char *op, Node *l, Node *r, int line)
{
    Node *n = node_new(N_BINOP, line);
    n->op = op; n->a = l; n->b = r;
    return n;
}

Node *node_neg(Node *e, int line)
{
    Node *n = node_new(N_NEG, line);
    n->a = e;
    return n;
}

Node *node_assign(char *name, Node *e, int line)
{
    Node *n = node_new(N_ASSIGN, line);
    n->name = name; n->a = e;
    return n;
}

Node *node_if(Node *cond, Node *then_s, Node *else_s, int line)
{
    Node *n = node_new(N_IF, line);
    n->a = cond; n->b = then_s; n->c = else_s;
    return n;
}

Node *node_while(Node *cond, Node *body, int line)
{
    Node *n = node_new(N_WHILE, line);
    n->a = cond; n->b = body;
    return n;
}

/* 문장을 왼쪽으로 접어 리스트를 만든다.
 * `stmt_list: stmt_list stmt` 가 좌재귀이므로 자연스럽게 이 모양이 된다. */
Node *node_seq(Node *first, Node *rest)
{
    if (!first) return rest;
    if (!rest)  return first;
    Node *n = node_new(N_SEQ, rest->line);
    n->a = first; n->b = rest;
    n->type = TY_VOID;
    return n;
}

Node *node_print(Node *e, int line)
{
    Node *n = node_new(N_PRINT, line);
    n->a = e;
    return n;
}

void node_free(Node *n)
{
    if (!n) return;
    node_free(n->a);
    node_free(n->b);
    node_free(n->c);
    free(n->name);
    free(n);
}

/* ══ AST 덤프 ══════════════════════════════════════════════ */

static void indent_by(int k) { for (int i = 0; i < k; i++) fputs("  ", stdout); }

void node_dump(const Node *n, int indent)
{
    if (!n) return;
    indent_by(indent);
    switch (n->kind) {
    case N_INT_LIT:   printf("int %ld\n", n->ival); break;
    case N_FLOAT_LIT: printf("float %g\n", n->fval); break;
    case N_VAR:       printf("var %s : %s\n", n->name, type_name(n->type)); break;
    case N_CONV:      printf("(%s)\n", type_name(n->type)); node_dump(n->a, indent + 1); break;
    case N_NEG:       printf("neg : %s\n", type_name(n->type)); node_dump(n->a, indent + 1); break;
    case N_BINOP:
        printf("%s : %s\n", n->op, type_name(n->type));
        node_dump(n->a, indent + 1);
        node_dump(n->b, indent + 1);
        break;
    case N_ASSIGN:
        printf("assign %s\n", n->name);
        node_dump(n->a, indent + 1);
        break;
    case N_PRINT:
        printf("print\n");
        node_dump(n->a, indent + 1);
        break;
    case N_IF:
        printf("if\n");
        node_dump(n->a, indent + 1);
        indent_by(indent); printf("then\n");
        node_dump(n->b, indent + 1);
        if (n->c) { indent_by(indent); printf("else\n"); node_dump(n->c, indent + 1); }
        break;
    case N_WHILE:
        printf("while\n");
        node_dump(n->a, indent + 1);
        indent_by(indent); printf("do\n");
        node_dump(n->b, indent + 1);
        break;
    case N_SEQ:
        printf("seq\n");
        node_dump(n->a, indent + 1);
        node_dump(n->b, indent + 1);
        break;
    case N_EMPTY: printf("(빈 문장)\n"); break;
    }
}

/* ══ 심볼 테이블 ═══════════════════════════════════════════
 * 교육용이므로 선형 탐색 배열로 충분하다.
 * 실제 컴파일러는 해시 테이블 + 스코프 스택을 쓴다.
 */
#define MAXSYMS 128

static struct { char name[64]; Type type; int line; } syms[MAXSYMS];
static int nsyms;

static int sym_index(const char *name)
{
    for (int i = 0; i < nsyms; i++)
        if (strcmp(syms[i].name, name) == 0) return i;
    return -1;
}

int sym_declare(const char *name, Type t, int line)
{
    int i = sym_index(name);
    if (i >= 0) {
        semantic_error(line, "'%s' 는 이미 %d행에서 선언되었다", name, syms[i].line);
        return 0;
    }
    if (nsyms >= MAXSYMS) {
        semantic_error(line, "심볼이 너무 많다");
        return 0;
    }
    snprintf(syms[nsyms].name, sizeof syms[nsyms].name, "%s", name);
    syms[nsyms].type = t;
    syms[nsyms].line = line;
    nsyms++;
    return 1;
}

Type sym_lookup(const char *name)
{
    int i = sym_index(name);
    return i < 0 ? TY_ERROR : syms[i].type;
}

void sym_dump(void)
{
    printf("=== 심볼 테이블 ===\n");
    if (nsyms == 0) { printf("  (없음)\n"); return; }
    for (int i = 0; i < nsyms; i++)
        printf("  %-12s %-6s (%d행 선언)\n",
               syms[i].name, type_name(syms[i].type), syms[i].line);
}

/* ══ 의미 분석 ═════════════════════════════════════════════ */

static int is_relational(const char *op)
{
    return strcmp(op, "<") == 0 || strcmp(op, ">") == 0 ||
           strcmp(op, "<=") == 0 || strcmp(op, ">=") == 0 ||
           strcmp(op, "==") == 0 || strcmp(op, "!=") == 0;
}

static int is_logical(const char *op)
{
    return strcmp(op, "&&") == 0 || strcmp(op, "||") == 0;
}

/* int 를 float 으로 올리는 변환 노드를 끼워 넣는다.
 * 1장에서 본 inttofloat 삽입이 바로 이것이다. */
static Node *coerce(Node *e, Type want)
{
    if (!e || e->type == want || e->type == TY_ERROR) return e;
    if (e->type == TY_INT && want == TY_FLOAT) {
        Node *c = node_new(N_CONV, e->line);
        c->a = e;
        c->type = TY_FLOAT;
        return c;
    }
    return e;   /* float → int 축소는 여기서 하지 않는다 (호출자가 진단) */
}

static void check(Node *n);

static void check_expr(Node *n)
{
    if (!n) return;
    switch (n->kind) {
    case N_INT_LIT:   n->type = TY_INT;   break;
    case N_FLOAT_LIT: n->type = TY_FLOAT; break;

    case N_VAR:
        n->type = sym_lookup(n->name);
        if (n->type == TY_ERROR)
            semantic_error(n->line, "선언되지 않은 변수 '%s'", n->name);
        break;

    case N_NEG:
        check_expr(n->a);
        n->type = n->a ? n->a->type : TY_ERROR;
        break;

    case N_BINOP:
        check_expr(n->a);
        check_expr(n->b);
        if (!n->a || !n->b || n->a->type == TY_ERROR || n->b->type == TY_ERROR) {
            n->type = TY_ERROR;
            break;
        }
        if (strcmp(n->op, "%") == 0) {
            if (n->a->type != TY_INT || n->b->type != TY_INT) {
                semantic_error(n->line, "%% 연산자는 int 에만 쓸 수 있다 (%s %% %s)",
                               type_name(n->a->type), type_name(n->b->type));
                n->type = TY_ERROR;
            } else {
                n->type = TY_INT;
            }
            break;
        }
        if (is_logical(n->op)) {
            /* C 처럼 0/비0 으로 다룬다. 결과는 int */
            n->type = TY_INT;
            break;
        }
        /* 산술·관계 연산: 한쪽이 float 이면 양쪽을 float 으로 올린다 */
        if (n->a->type == TY_FLOAT || n->b->type == TY_FLOAT) {
            n->a = coerce(n->a, TY_FLOAT);
            n->b = coerce(n->b, TY_FLOAT);
            n->type = is_relational(n->op) ? TY_INT : TY_FLOAT;
        } else {
            n->type = is_relational(n->op) ? TY_INT : TY_INT;
        }
        break;

    default:
        break;
    }
}

static void check(Node *n)
{
    if (!n) return;
    switch (n->kind) {
    case N_SEQ:
        check(n->a);
        check(n->b);
        break;

    case N_ASSIGN: {
        Type declared = sym_lookup(n->name);
        check_expr(n->a);
        if (declared == TY_ERROR) {
            semantic_error(n->line, "선언되지 않은 변수 '%s' 에 대입", n->name);
            break;
        }
        if (n->a && n->a->type != TY_ERROR) {
            if (declared == TY_FLOAT && n->a->type == TY_INT) {
                n->a = coerce(n->a, TY_FLOAT);      /* 확대 — 조용히 허용 */
            } else if (declared == TY_INT && n->a->type == TY_FLOAT) {
                semantic_error(n->line,
                    "int 변수 '%s' 에 float 값을 대입한다 (암묵적 축소는 허용하지 않는다)",
                    n->name);
            }
        }
        n->type = declared;
        break;
    }

    case N_PRINT:
        check_expr(n->a);
        n->type = TY_VOID;
        break;

    case N_IF:
        check_expr(n->a);
        check(n->b);
        check(n->c);
        n->type = TY_VOID;
        break;

    case N_WHILE:
        check_expr(n->a);
        check(n->b);
        n->type = TY_VOID;
        break;

    default:
        check_expr(n);
        break;
    }
}

void check_program(Node *root) { check(root); }

/* ══ 3-주소 코드 생성 ══════════════════════════════════════
 *
 * 조건문은 "값 방식"으로 만든다.
 *   t1 = a < b
 *   ifFalse t1 goto L1
 * 백패칭(backpatching)을 쓰는 "점프 코드" 방식보다 단순하고,
 * 최적화 단계에서 어차피 정리되므로 교육용으로는 이쪽이 낫다.
 */

static int ntemp;
static int nlabel;

static char *new_temp(void)
{
    static char buf[32][16];      /* 순환 버퍼 — 한 문장에 16개면 충분하다 */
    static int  slot;
    slot = (slot + 1) % 32;
    snprintf(buf[slot], sizeof buf[slot], "t%d", ++ntemp);
    return buf[slot];
}

static int new_label(void) { return ++nlabel; }

static void emit(const char *fmt, ...)
{
    va_list ap;
    fputs("  ", stdout);
    va_start(ap, fmt);
    vprintf(fmt, ap);
    va_end(ap);
    putchar('\n');
}

static void emit_label(int l) { printf("L%d:\n", l); }

/* 식의 코드를 뽑고, 결과가 담긴 "주소"(변수명·상수·임시변수)를 돌려준다 */
static const char *gen_expr(Node *n)
{
    static char lit[32];
    if (!n) return "?";

    switch (n->kind) {
    case N_INT_LIT:
        snprintf(lit, sizeof lit, "%ld", n->ival);
        return lit;

    case N_FLOAT_LIT:
        snprintf(lit, sizeof lit, "%g", n->fval);
        return lit;

    case N_VAR:
        return n->name;

    case N_CONV: {
        const char *a = gen_expr(n->a);
        char *t = new_temp();
        emit("%s = inttofloat %s", t, a);
        return t;
    }

    case N_NEG: {
        const char *a = gen_expr(n->a);
        char *t = new_temp();
        emit("%s = -%s", t, a);
        return t;
    }

    case N_BINOP: {
        const char *a = gen_expr(n->a);
        /* a 가 임시변수를 가리킬 수 있으므로 복사해 둔다 */
        char abuf[32];
        snprintf(abuf, sizeof abuf, "%s", a);
        const char *b = gen_expr(n->b);
        char *t = new_temp();
        emit("%s = %s %s %s", t, abuf, n->op, b);
        return t;
    }

    default:
        return "?";
    }
}

static void gen(Node *n)
{
    if (!n) return;

    switch (n->kind) {
    case N_SEQ:
        gen(n->a);
        gen(n->b);
        break;

    case N_ASSIGN: {
        const char *v = gen_expr(n->a);
        emit("%s = %s", n->name, v);
        break;
    }

    case N_PRINT: {
        const char *v = gen_expr(n->a);
        emit("print %s", v);
        break;
    }

    case N_IF: {
        const char *c = gen_expr(n->a);
        if (n->c) {                       /* if ... else ... */
            int l_else = new_label();
            int l_end  = new_label();
            emit("ifFalse %s goto L%d", c, l_else);
            gen(n->b);
            emit("goto L%d", l_end);
            emit_label(l_else);
            gen(n->c);
            emit_label(l_end);
        } else {                          /* if ... */
            int l_end = new_label();
            emit("ifFalse %s goto L%d", c, l_end);
            gen(n->b);
            emit_label(l_end);
        }
        break;
    }

    case N_WHILE: {
        int l_top  = new_label();
        int l_exit = new_label();
        emit_label(l_top);
        const char *c = gen_expr(n->a);
        emit("ifFalse %s goto L%d", c, l_exit);
        gen(n->b);
        emit("goto L%d", l_top);
        emit_label(l_exit);
        break;
    }

    default:
        gen_expr(n);
        break;
    }
}

void gen_program(Node *root)
{
    printf("=== 3-주소 코드 ===\n");
    ntemp = 0;
    nlabel = 0;
    if (!root) { printf("  (없음)\n"); return; }
    gen(root);
}

/* ══ main ══════════════════════════════════════════════════ */

int main(int argc, char **argv)
{
    int dump_ast = 0;
    for (int i = 1; i < argc; i++)
        if (strcmp(argv[i], "-a") == 0) dump_ast = 1;

    if (yyparse() != 0 && sema_errors == 0)
        sema_errors++;

    sym_dump();

    check_program(program_root);

    if (dump_ast) {
        printf("=== AST ===\n");
        if (program_root) node_dump(program_root, 1);
        else              printf("  (비어 있음)\n");
    }

    if (sema_errors == 0) {
        gen_program(program_root);
    } else {
        printf("=== 3-주소 코드 ===\n");
        printf("  (오류가 있어 생성하지 않았다)\n");
    }

    printf("----\n");
    if (sema_errors == 0) printf("컴파일 성공\n");
    else                  printf("오류 %d건\n", sema_errors);

    node_free(program_root);
    return sema_errors == 0 ? 0 : 1;
}
