/* lrparse.c — 손으로 쓴 표 구동 LR 파서
 *
 * 이 예제가 보여 주는 것
 *   - 교안 15장에서 손으로 만든 SLR(1) 표가 **그대로 배열이 된다**는 것
 *   - LR 구동 알고리즘의 전부가 20줄 남짓이라는 것
 *   - 상태 스택과 **의미 값 스택**이 나란히 움직인다는 것
 *     (yacc 의 $$ / $1 / $2 가 바로 이 값 스택이다)
 *   - 축약 순서를 뒤집으면 우측 유도가 나온다는 것
 *   - 오류 시 "기대하는 토큰 목록"을 표에서 바로 뽑을 수 있다는 것
 *
 * 문법 (15장과 같다. id 자리에 실제 수를 넣어 값도 계산한다)
 *   (0) E' → E
 *   (1) E  → E + T          (2) E → T
 *   (3) T  → T * F          (4) T → F
 *   (5) F  → ( E )          (6) F → num
 *
 * 사용법
 *   ./lrparse         한 줄에 하나씩 식을 읽어 값을 출력
 *   ./lrparse -t      파싱 과정을 스택/입력/동작 표로 추적
 *
 *   cc -std=c11 -Wall -Wextra -O2 -o lrparse lrparse.c
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

/* ══ 토큰 ══════════════════════════════════════════════════
 * 표의 열 순서와 반드시 일치해야 한다.
 */
enum { TK_NUM, TK_PLUS, TK_STAR, TK_LPAREN, TK_RPAREN, TK_EOI, NTERMINALS };

static const char *const TERM_NAME[NTERMINALS] = {
    "num", "+", "*", "(", ")", "$"
};

/* 넌터미널 — GOTO 표의 열 */
enum { NT_E, NT_T, NT_F, NNONTERMINALS };

static const char *const NONTERM_NAME[NNONTERMINALS] = { "E", "T", "F" };

/* ══ 생성 규칙 ═════════════════════════════════════════════ */
typedef struct { int lhs; int rhslen; const char *text; } Production;

static const Production PROD[] = {
    /* 0 */ { NT_E, 1, "E' -> E"    },   /* 증강 규칙 */
    /* 1 */ { NT_E, 3, "E  -> E + T" },
    /* 2 */ { NT_E, 1, "E  -> T"     },
    /* 3 */ { NT_T, 3, "T  -> T * F" },
    /* 4 */ { NT_T, 1, "T  -> F"     },
    /* 5 */ { NT_F, 3, "F  -> ( E )" },
    /* 6 */ { NT_F, 1, "F  -> num"   },
};

/* ══ SLR(1) 파싱 표 ════════════════════════════════════════
 *
 * 교안 15.4절의 표를 그대로 옮긴 것이다.
 *   양수  n  → shift, 상태 n 으로
 *   음수 -n  → reduce, 규칙 n 으로
 *   ACC      → accept
 *   ERR      → 오류
 */
#define NSTATES 12
#define ERR   0
#define ACC   999
#define SH(n) (n)
#define RE(n) (-(n))

/*                     num    +      *      (      )      $     */
static const int ACTION[NSTATES][NTERMINALS] = {
/*  0 */ { SH(5),  ERR,   ERR,   SH(4),  ERR,   ERR   },
/*  1 */ { ERR,    SH(6), ERR,   ERR,    ERR,   ACC   },
/*  2 */ { ERR,    RE(2), SH(7), ERR,    RE(2), RE(2) },
/*  3 */ { ERR,    RE(4), RE(4), ERR,    RE(4), RE(4) },
/*  4 */ { SH(5),  ERR,   ERR,   SH(4),  ERR,   ERR   },
/*  5 */ { ERR,    RE(6), RE(6), ERR,    RE(6), RE(6) },
/*  6 */ { SH(5),  ERR,   ERR,   SH(4),  ERR,   ERR   },
/*  7 */ { SH(5),  ERR,   ERR,   SH(4),  ERR,   ERR   },
/*  8 */ { ERR,    SH(6), ERR,   ERR,    SH(11),ERR   },
/*  9 */ { ERR,    RE(1), SH(7), ERR,    RE(1), RE(1) },
/* 10 */ { ERR,    RE(3), RE(3), ERR,    RE(3), RE(3) },
/* 11 */ { ERR,    RE(5), RE(5), ERR,    RE(5), RE(5) },
};

/*                       E    T    F  */
static const int GOTO[NSTATES][NNONTERMINALS] = {
/*  0 */ {  1,   2,   3 },
/*  1 */ {  0,   0,   0 },
/*  2 */ {  0,   0,   0 },
/*  3 */ {  0,   0,   0 },
/*  4 */ {  8,   2,   3 },
/*  5 */ {  0,   0,   0 },
/*  6 */ {  0,   9,   3 },
/*  7 */ {  0,   0,  10 },
/*  8 */ {  0,   0,   0 },
/*  9 */ {  0,   0,   0 },
/* 10 */ {  0,   0,   0 },
/* 11 */ {  0,   0,   0 },
};

/* ══ 어휘 분석 ═════════════════════════════════════════════ */
static const char *src;
static const char *src_base;
static int  tok;
static long tok_val;
static const char *tok_pos;

static void advance(void)
{
    while (*src == ' ' || *src == '\t') src++;
    tok_pos = src;
    if (*src == '\0') { tok = TK_EOI; return; }
    if (isdigit((unsigned char)*src)) {
        tok_val = strtol(src, (char **)&src, 10);
        tok = TK_NUM;
        return;
    }
    switch (*src++) {
    case '+': tok = TK_PLUS;   return;
    case '*': tok = TK_STAR;   return;
    case '(': tok = TK_LPAREN; return;
    case ')': tok = TK_RPAREN; return;
    default:  src--; tok = -1;  return;   /* 인식할 수 없는 문자 */
    }
}

/* ══ 파서 ══════════════════════════════════════════════════ */
#define MAXSTACK 128

static int  state_stack[MAXSTACK];   /* 상태 */
static long val_stack[MAXSTACK];     /* 의미 값 — yacc 의 $1, $2 … */
static char sym_stack[MAXSTACK][8];  /* 화면 표시용 심볼 이름 */
static int  sp;

static int trace;
static int step_no;

static void show_row(const char *action)
{
    if (!trace) return;

    char stack_buf[256] = "";
    for (int i = 0; i <= sp; i++) {
        char piece[32];
        if (i == 0) snprintf(piece, sizeof piece, "%d", state_stack[i]);
        else        snprintf(piece, sizeof piece, " %s %d", sym_stack[i], state_stack[i]);
        strncat(stack_buf, piece, sizeof stack_buf - strlen(stack_buf) - 1);
    }

    /* 남은 입력 = 현재 토큰이 시작된 위치부터 줄 끝까지 */
    char input_buf[64];
    if (tok == TK_EOI) snprintf(input_buf, sizeof input_buf, "$");
    else               snprintf(input_buf, sizeof input_buf, "%.20s $", tok_pos);

    printf("  %2d | %-28s | %-14s | %s\n", ++step_no, stack_buf, input_buf, action);
}

/* 축약 순서를 모아 두면 뒤집었을 때 우측 유도가 된다 */
static int reductions[256];
static int nreductions;

static int parse(long *result)
{
    sp = 0;
    state_stack[0] = 0;
    val_stack[0] = 0;
    sym_stack[0][0] = '\0';
    step_no = 0;
    nreductions = 0;

    for (;;) {
        int s = state_stack[sp];

        if (tok < 0) {
            printf("  오류 %d열: 인식할 수 없는 문자 '%c'\n",
                   (int)(tok_pos - src_base) + 1, *tok_pos);
            return 0;
        }

        int act = ACTION[s][tok];

        if (act == ACC) {
            show_row("수락");
            *result = val_stack[sp];
            return 1;
        }

        if (act == ERR) {
            /* 표의 그 행에서 ERR 이 아닌 열이 곧 "기대하는 토큰" 이다.
             * 좋은 오류 메시지를 표에서 공짜로 얻는 셈이다. */
            char expect[128] = "";
            for (int t = 0; t < NTERMINALS; t++) {
                if (ACTION[s][t] == ERR) continue;
                if (expect[0]) strncat(expect, ", ", sizeof expect - strlen(expect) - 1);
                strncat(expect, TERM_NAME[t], sizeof expect - strlen(expect) - 1);
            }
            printf("  오류 %d열 | 실제: %s | 기대: %s | 상태: %d\n",
                   (int)(tok_pos - src_base) + 1, TERM_NAME[tok], expect, s);
            return 0;
        }

        if (act > 0) {                          /* ── 이동 ── */
            char buf[32];
            snprintf(buf, sizeof buf, "이동 s%d", act);
            show_row(buf);

            if (sp + 1 >= MAXSTACK) { printf("  오류: 스택 넘침\n"); return 0; }
            sp++;
            state_stack[sp] = act;
            val_stack[sp]   = tok_val;
            snprintf(sym_stack[sp], sizeof sym_stack[sp], "%s", TERM_NAME[tok]);
            advance();
            continue;
        }

        /* ── 축약 ── */
        int p = -act;
        char buf[64];
        snprintf(buf, sizeof buf, "축약 r%d : %s", p, PROD[p].text);
        show_row(buf);

        if (nreductions < (int)(sizeof reductions / sizeof reductions[0]))
            reductions[nreductions++] = p;

        /* 의미 동작 — yacc 의 액션 코드에 해당한다.
         * 우변 길이만큼 걷어 내기 **전에** 값을 읽어야 한다. */
        long v = 0;
        switch (p) {
        case 1: v = val_stack[sp - 2] + val_stack[sp]; break;  /* E → E + T */
        case 3: v = val_stack[sp - 2] * val_stack[sp]; break;  /* T → T * F */
        case 5: v = val_stack[sp - 1];                 break;  /* F → ( E ) */
        default: v = val_stack[sp];                    break;  /* 단일 생성 규칙 */
        }

        sp -= PROD[p].rhslen;

        int go = GOTO[state_stack[sp]][PROD[p].lhs];
        if (go == 0) { printf("  오류: GOTO 가 비어 있다\n"); return 0; }

        sp++;
        state_stack[sp] = go;
        val_stack[sp]   = v;
        snprintf(sym_stack[sp], sizeof sym_stack[sp], "%s", NONTERM_NAME[PROD[p].lhs]);
    }
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
        /* 표 머리글은 ASCII 로 둔다. printf 의 폭 지정자는 바이트 수를 세므로
         * 한글을 넣으면 열이 어긋난다. stack=스택, input=입력, action=동작 */
        if (trace)
            printf("   # | %-28s | %-14s | %s\n", "stack", "input", "action");

        src = src_base = line;
        advance();

        long result = 0;
        if (parse(&result)) {
            printf("  값: %ld\n", result);
            if (trace) {
                printf("  축약을 역순으로 읽으면 우측 유도: ");
                for (int i = nreductions - 1; i >= 0; i--)
                    printf("r%d%s", reductions[i], i ? " -> " : "\n");
            }
        } else {
            failures++;
        }
    }

    printf("----\n");
    if (failures == 0) printf("모두 정상 처리\n");
    else               printf("실패 %d건\n", failures);
    return failures == 0 ? 0 : 1;
}
