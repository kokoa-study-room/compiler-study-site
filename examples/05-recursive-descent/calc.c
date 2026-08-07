/* calc.c — 손으로 쓴 재귀 하강 LL(1) 계산기
 *
 * 이 예제가 보여 주는 것
 *   - 넌터미널 하나 = 함수 하나 라는 재귀 하강의 기본 대응
 *   - 좌재귀를 제거하면 EBNF 반복 { } 가 되고, 그것이 while 루프가 된다는 것
 *   - **좌결합을 유지하려면 값을 왼쪽으로 접어야 한다**는 것
 *     (좌재귀 제거의 실질적 대가)
 *   - 호출 스택이 곧 파싱 스택이라는 것 (-t 로 눈에 보인다)
 *   - 문맥을 아는 오류 메시지를 쉽게 낼 수 있다는 것
 *
 * 문법 (EBNF)
 *   expr   = term , { ("+" | "-") , term } ;
 *   term   = factor , { ("*" | "/") , factor } ;
 *   factor = "(" , expr , ")" | "-" , factor | number ;
 *
 * 사용법
 *   ./calc          한 줄에 하나씩 식을 읽어 AST 와 값을 출력
 *   ./calc -t       재귀 하강 호출 과정을 들여쓰기로 추적
 *
 *   cc -std=c11 -Wall -Wextra -O2 -o calc calc.c
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

/* ══ 어휘 분석 ═════════════════════════════════════════════
 * 3부에서 flex 로 만들던 것을 손으로 쓴 것. 아주 작다.
 */
typedef enum {
    T_NUM, T_PLUS, T_MINUS, T_STAR, T_SLASH,
    T_LPAREN, T_RPAREN, T_END, T_BAD
} TokKind;

static const char *const TOK_NAME[] = {
    "number", "'+'", "'-'", "'*'", "'/'", "'('", "')'", "입력 끝", "잘못된 문자"
};

static const char *src;      /* 현재 읽는 위치 */
static const char *src_base; /* 오류 위치 계산용 시작점 */
static TokKind     tok;      /* 현재 lookahead 토큰 */
static long        tok_val;  /* T_NUM 일 때의 값 */
static const char *tok_pos;  /* 현재 토큰이 시작된 위치 */

static int trace;            /* -t 옵션 */
static int depth;            /* 추적 출력의 들여쓰기 깊이 */
static int had_error;

static void advance(void)
{
    while (*src == ' ' || *src == '\t') src++;
    tok_pos = src;

    if (*src == '\0') { tok = T_END; return; }

    if (isdigit((unsigned char)*src)) {
        tok_val = strtol(src, (char **)&src, 10);
        tok = T_NUM;
        return;
    }

    switch (*src++) {
    case '+': tok = T_PLUS;   return;
    case '-': tok = T_MINUS;  return;
    case '*': tok = T_STAR;   return;
    case '/': tok = T_SLASH;  return;
    case '(': tok = T_LPAREN; return;
    case ')': tok = T_RPAREN; return;
    default:  src--; tok = T_BAD; return;
    }
}

/* ══ AST ═══════════════════════════════════════════════════ */
typedef struct Node {
    enum { N_NUM, N_BINOP, N_NEG } kind;
    long  value;                 /* N_NUM */
    char  op;                    /* N_BINOP */
    struct Node *l, *r;
} Node;

static Node *new_num(long v)
{
    Node *n = calloc(1, sizeof *n);
    n->kind = N_NUM; n->value = v;
    return n;
}

static Node *new_binop(char op, Node *l, Node *r)
{
    Node *n = calloc(1, sizeof *n);
    n->kind = N_BINOP; n->op = op; n->l = l; n->r = r;
    return n;
}

static Node *new_neg(Node *x)
{
    Node *n = calloc(1, sizeof *n);
    n->kind = N_NEG; n->l = x;
    return n;
}

static void free_node(Node *n)
{
    if (!n) return;
    free_node(n->l);
    free_node(n->r);
    free(n);
}

static void print_ast(const Node *n)
{
    if (!n) { fputs("?", stdout); return; }
    switch (n->kind) {
    case N_NUM:   printf("%ld", n->value); break;
    case N_NEG:   printf("(- "); print_ast(n->l); printf(")"); break;
    case N_BINOP:
        printf("(%c ", n->op);
        print_ast(n->l);
        putchar(' ');
        print_ast(n->r);
        putchar(')');
        break;
    }
}

static long eval(const Node *n, int *ok)
{
    if (!n || !*ok) return 0;
    switch (n->kind) {
    case N_NUM: return n->value;
    case N_NEG: return -eval(n->l, ok);
    case N_BINOP: {
        long a = eval(n->l, ok);
        long b = eval(n->r, ok);
        if (!*ok) return 0;
        switch (n->op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/':
            if (b == 0) { printf("  오류: 0으로 나눌 수 없다\n"); *ok = 0; return 0; }
            return a / b;
        }
        return 0;
    }
    }
    return 0;
}

/* ══ 오류 보고 ═════════════════════════════════════════════
 * 재귀 하강의 장점: 지금 어느 함수 안에 있는지가 곧 문맥이다.
 */
static void error_at(const char *what, const char *context)
{
    had_error = 1;
    int col = (int)(tok_pos - src_base) + 1;
    /* 조사(을/를)가 뒤 단어에 따라 달라지므로, 라벨 형식으로 적어 회피한다 */
    printf("  오류 %d열 | 기대: %s | 실제: %s | 문맥: %s\n",
           col, what, TOK_NAME[tok], context);
}

static void enter(const char *name)
{
    if (!trace) return;
    printf("  %*s→ %s   (lookahead = %s)\n", depth * 2, "", name, TOK_NAME[tok]);
    depth++;
}

static void leave(const char *name)
{
    if (!trace) return;
    depth--;
    printf("  %*s← %s\n", depth * 2, "", name);
}

/* ══ 재귀 하강 파서 ════════════════════════════════════════ */
static Node *parse_expr(void);

/*  factor = "(" expr ")" | "-" factor | number  */
static Node *parse_factor(void)
{
    enter("factor");
    Node *n = NULL;

    if (tok == T_LPAREN) {
        advance();
        n = parse_expr();
        if (tok != T_RPAREN) {
            error_at("')'", "괄호식");
        } else {
            advance();
        }
    } else if (tok == T_MINUS) {          /* 단항 마이너스 — 우재귀 */
        advance();
        n = new_neg(parse_factor());
    } else if (tok == T_NUM) {
        n = new_num(tok_val);
        advance();
    } else {
        error_at("수 또는 '('", "factor");
    }

    leave("factor");
    return n;
}

/*  term = factor , { ("*" | "/") , factor }
 *
 *  좌재귀 T → T * F 를 제거하면 EBNF 의 { } 가 되고,
 *  그것이 아래 while 루프다. 트리는 매 반복마다 **왼쪽으로 접힌다**.
 *  이 한 줄(`left = new_binop(...)`)이 좌결합을 만든다.
 */
static Node *parse_term(void)
{
    enter("term");
    Node *left = parse_factor();

    while (tok == T_STAR || tok == T_SLASH) {
        char op = (tok == T_STAR) ? '*' : '/';
        advance();
        Node *right = parse_factor();
        left = new_binop(op, left, right);   /* ← 왼쪽으로 접는다 */
    }

    leave("term");
    return left;
}

/*  expr = term , { ("+" | "-") , term }  */
static Node *parse_expr(void)
{
    enter("expr");
    Node *left = parse_term();

    while (tok == T_PLUS || tok == T_MINUS) {
        char op = (tok == T_PLUS) ? '+' : '-';
        advance();
        Node *right = parse_term();
        left = new_binop(op, left, right);
    }

    leave("expr");
    return left;
}

/* ══ main ══════════════════════════════════════════════════ */
int main(int argc, char **argv)
{
    trace = (argc > 1 && strcmp(argv[1], "-t") == 0);

    char line[512];
    int failures = 0;

    while (fgets(line, sizeof line, stdin)) {
        line[strcspn(line, "\r\n")] = '\0';
        if (line[0] == '\0') continue;

        printf("식: %s\n", line);

        src = src_base = line;
        had_error = 0;
        depth = 0;
        advance();

        Node *ast = parse_expr();

        if (tok != T_END && !had_error) {
            error_at("입력 끝", "식 전체");
        }

        if (had_error) {
            failures++;
        } else {
            printf("  AST: ");
            print_ast(ast);
            putchar('\n');
            int ok = 1;
            long v = eval(ast, &ok);
            if (ok) printf("  값: %ld\n", v);
            else    failures++;
        }
        free_node(ast);
    }

    printf("----\n");
    if (failures == 0) printf("모두 정상 처리\n");
    else               printf("실패 %d건\n", failures);
    return failures == 0 ? 0 : 1;
}
