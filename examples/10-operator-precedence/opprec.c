/* opprec.c — 연산자 우선순위 파서
 *
 * 이 예제가 보여 주는 것
 *   - 교안 14장의 우선 관계 표가 **그대로 6×6 배열이 된다**는 것
 *   - 파서에 **상태가 없다**는 것 — 스택 맨 위 터미널과 다음 입력, 둘만 본다
 *   - 그래서 표가 LR 표보다 훨씬 작다는 것 (36칸 vs 12상태 × 9열)
 *   - 그 대가로 **넌터미널을 구별하지 못한다**는 것
 *
 * 06-lr-table-driven 과 입력 형식·출력 형식을 맞춰 두었다.
 * 같은 식을 두 파서에 넣어 보면 "같은 결과, 다른 길"을 볼 수 있다.
 *
 *   ./opprec           한 줄에 하나씩 식을 읽어 값을 출력
 *   ./opprec -t        파싱 과정을 스택/입력/관계/동작 표로 추적
 *
 *   cc -std=c11 -Wall -Wextra -O2 -o opprec opprec.c
 *
 * 문법 (모호하다 — 우선 관계 표가 모호성을 대신 해결한다)
 *   E → E + E | E * E | ( E ) | num
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

/* ══ 터미널 ════════════════════════════════════════════════
 * 표의 행·열 순서와 반드시 일치해야 한다.
 */
enum { TK_NUM, TK_PLUS, TK_STAR, TK_LPAREN, TK_RPAREN, TK_EOI, NTERM };

static const char *const TERM_NAME[NTERM] = { "num", "+", "*", "(", ")", "$" };

/* 스택에 쌓이는 넌터미널. 이 기법은 넌터미널을 구별하지 않으므로 하나면 된다. */
#define SYM_E  NTERM

/* ══ 우선 관계 ═════════════════════════════════════════════ */
enum { NONE = 0, LT, EQ, GT };            /* NONE = 빈 칸 = 구문 오류 */

static const char REL_CH[] = { '?', '<', '=', '>' };   /* ⋖ ≐ ⋗ 의 ASCII 표기 */

/* PREC[왼쪽 터미널][오른쪽 터미널] — 교안 14.2절의 표 그대로다.
 *
 *          num   +    *    (    )    $                                   */
static const unsigned char PREC[NTERM][NTERM] = {
/* num */ { NONE, GT,  GT,  NONE, GT,  GT   },
/* +   */ { LT,   GT,  LT,  LT,   GT,  GT   },
/* *   */ { LT,   GT,  GT,  LT,   GT,  GT   },
/* (   */ { LT,   LT,  LT,  LT,   EQ,  NONE },
/* )   */ { NONE, GT,  GT,  NONE, GT,  GT   },
/* $   */ { LT,   LT,  LT,  LT,   NONE, NONE },
};

/* ══ 어휘 분석 ═════════════════════════════════════════════ */
typedef struct { int kind; long val; int col; } Token;

#define MAXTOK 256
static Token toks[MAXTOK];
static int ntok;

/* 한 줄을 토큰 열로 바꾼다. 실패하면 0 을 돌려준다. */
static int tokenize(const char *s)
{
    ntok = 0;
    for (const char *p = s; *p; ) {
        if (isspace((unsigned char)*p)) { p++; continue; }
        if (ntok >= MAXTOK - 1) { printf("  오류: 토큰이 너무 많다\n"); return 0; }

        Token t = { .col = (int)(p - s) + 1 };
        if (isdigit((unsigned char)*p)) {
            char *end;
            t.kind = TK_NUM;
            t.val  = strtol(p, &end, 10);
            p = end;
        } else {
            switch (*p) {
            case '+': t.kind = TK_PLUS;   break;
            case '*': t.kind = TK_STAR;   break;
            case '(': t.kind = TK_LPAREN; break;
            case ')': t.kind = TK_RPAREN; break;
            default:
                printf("  오류 %d열: 인식할 수 없는 문자 '%c'\n", t.col, *p);
                return 0;
            }
            p++;
        }
        toks[ntok++] = t;
    }
    toks[ntok] = (Token){ .kind = TK_EOI, .col = (int)strlen(s) + 1 };
    return 1;
}

/* ══ 파서 ══════════════════════════════════════════════════ */
typedef struct { int sym; long val; } Cell;    /* sym: 터미널 id 또는 SYM_E */

#define MAXSTACK 256
static Cell st[MAXSTACK];
static int sp;

static const char *sym_name(int sym)
{
    return sym == SYM_E ? "E" : TERM_NAME[sym];
}

/* 스택을 "$ E + E" 처럼 한 줄로 */
static void stack_str(char *buf, size_t n)
{
    size_t k = 0;
    buf[0] = '\0';
    for (int i = 0; i < sp; i++)
        k += (size_t)snprintf(buf + k, k < n ? n - k : 0, "%s%s", i ? " " : "", sym_name(st[i].sym));
}

/* 남은 입력을 "3 * 4 $" 처럼 한 줄로 */
static void input_str(char *buf, size_t n, int ip)
{
    size_t k = 0;
    buf[0] = '\0';
    for (int i = ip; i <= ntok; i++) {
        if (toks[i].kind == TK_NUM)
            k += (size_t)snprintf(buf + k, k < n ? n - k : 0, "%s%ld", i > ip ? " " : "", toks[i].val);
        else
            k += (size_t)snprintf(buf + k, k < n ? n - k : 0, "%s%s", i > ip ? " " : "", TERM_NAME[toks[i].kind]);
        if (toks[i].kind == TK_EOI) break;
    }
}

/* 스택에서 넌터미널을 건너뛰고 가장 위의 터미널 위치 */
static int top_terminal(void)
{
    for (int i = sp - 1; i >= 0; i--)
        if (st[i].sym != SYM_E) return i;
    return -1;
}

/* 걷어 낸 핸들로 값을 계산한다. 맞는 규칙이 없으면 0 을 돌려준다. */
static int apply(int start, long *out, const char **rule)
{
    int len = sp - start;
    const Cell *h = &st[start];

    if (len == 1 && h[0].sym == TK_NUM) {
        *out = h[0].val; *rule = "E -> num"; return 1;
    }
    if (len == 3 && h[0].sym == SYM_E && h[2].sym == SYM_E) {
        if (h[1].sym == TK_PLUS) { *out = h[0].val + h[2].val; *rule = "E -> E + E"; return 1; }
        if (h[1].sym == TK_STAR) { *out = h[0].val * h[2].val; *rule = "E -> E * E"; return 1; }
    }
    if (len == 3 && h[0].sym == TK_LPAREN && h[1].sym == SYM_E && h[2].sym == TK_RPAREN) {
        *out = h[1].val; *rule = "E -> ( E )"; return 1;
    }
    return 0;
}

static int trace;

static void trace_row(int n, int ip, const char *rel, const char *act)
{
    char sbuf[256], ibuf[256];
    stack_str(sbuf, sizeof sbuf);
    input_str(ibuf, sizeof ibuf, ip);
    printf("  %2d | %-28s | %-14s | %-7s | %s\n", n, sbuf, ibuf, rel, act);
}

/* 성공하면 1 과 값을 돌려준다. */
static int parse(long *result)
{
    sp = 0;
    st[sp++] = (Cell){ .sym = TK_EOI, .val = 0 };
    int ip = 0, step = 0;

    if (trace)
        printf("   # | %-28s | %-14s | %-7s | %s\n", "stack", "input", "relation", "action");

    for (;;) {
        int ti = top_terminal();
        int a = st[ti].sym;
        int b = toks[ip].kind;

        if (a == TK_EOI && b == TK_EOI) {
            /* 스택이 "$ E" 여야 완결된 식이다 */
            if (sp == 2 && st[1].sym == SYM_E) {
                if (trace) trace_row(++step, ip, "-", "수락");
                *result = st[1].val;
                return 1;
            }
            printf("  오류 %d열: 완결된 식이 아니다\n", toks[ip].col);
            return 0;
        }

        int rel = PREC[a][b];
        char relbuf[16];
        snprintf(relbuf, sizeof relbuf, "%s %c %s", TERM_NAME[a], REL_CH[rel], TERM_NAME[b]);

        if (rel == NONE) {
            if (trace) trace_row(++step, ip, relbuf, "오류");
            printf("  오류 %d열: '%s' 다음에 '%s' 가 올 수 없다 (표가 빈 칸)\n",
                   toks[ip].col, TERM_NAME[a], TERM_NAME[b]);
            return 0;
        }

        if (rel == LT || rel == EQ) {
            char act[32];
            snprintf(act, sizeof act, "이동 %s", TERM_NAME[b]);
            if (trace) trace_row(++step, ip, relbuf, act);
            if (sp >= MAXSTACK) { printf("  오류: 스택 넘침\n"); return 0; }
            st[sp++] = (Cell){ .sym = b, .val = toks[ip].val };
            ip++;
            continue;
        }

        /* rel == GT — 핸들을 걷어 낸다.
         *
         * 오른쪽 끝은 스택 맨 위 터미널이다.
         * 왼쪽으로 ≐ 로 이어진 구간을 지나 ⋖ 를 만나는 자리가 왼쪽 끝이고,
         * 그 앞에 넌터미널이 있으면 그것까지 핸들이다. */
        int idx[MAXSTACK], ni = 0;
        for (int i = 0; i < sp; i++)
            if (st[i].sym != SYM_E) idx[ni++] = i;

        int j = ni - 1;
        while (j > 0 && PREC[st[idx[j - 1]].sym][st[idx[j]].sym] == EQ) j--;

        if (j == 0) {
            if (trace) trace_row(++step, ip, relbuf, "오류");
            printf("  오류 %d열: 걷어 낼 핸들이 없다\n", toks[ip].col);
            return 0;
        }

        int start = idx[j];
        if (start > 0 && st[start - 1].sym == SYM_E) start--;

        long val;
        const char *rule;
        if (!apply(start, &val, &rule)) {
            char h[128] = "";
            size_t k = 0;
            for (int i = start; i < sp; i++)
                k += (size_t)snprintf(h + k, k < sizeof h ? sizeof h - k : 0,
                                      "%s%s", i > start ? " " : "", sym_name(st[i].sym));
            if (trace) trace_row(++step, ip, relbuf, "오류");
            printf("  오류 %d열: '%s' 에 맞는 규칙이 없다\n", toks[ip].col, h);
            return 0;
        }

        char act[64];
        snprintf(act, sizeof act, "축약 %s", rule);
        if (trace) trace_row(++step, ip, relbuf, act);

        sp = start;
        st[sp++] = (Cell){ .sym = SYM_E, .val = val };
    }
}

int main(int argc, char **argv)
{
    for (int i = 1; i < argc; i++)
        if (strcmp(argv[i], "-t") == 0) trace = 1;

    char line[1024];
    int ng = 0;

    while (fgets(line, sizeof line, stdin)) {
        line[strcspn(line, "\n")] = '\0';
        if (line[0] == '\0') continue;

        printf("식: %s\n", line);
        fflush(stdout);

        long v;
        if (tokenize(line) && parse(&v)) {
            printf("  값: %ld\n", v);
        } else {
            ng++;
        }
        if (trace) printf("----\n");
        fflush(stdout);
    }

    if (ng == 0) printf("모두 정상 처리\n");
    else         printf("실패 %d건\n", ng);
    return ng ? 1 : 0;
}
