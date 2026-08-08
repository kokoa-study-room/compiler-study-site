/* attreval.c — 속성 평가기
 *
 * 교안 17장(구문 지향 번역)을 손으로 구현한 것이다.
 *
 * 이 예제가 보여 주는 것
 *   - 속성 문법이 실제 자료구조로는 무엇인가 (노드 + 속성 인스턴스 + 의존 간선)
 *   - 계산 순서가 **의존 그래프의 위상 정렬**로 정해진다는 것
 *   - 합성 속성만 쓰면 그 순서가 **후위 순회와 같아진다**는 것
 *   - 상속 속성이 끼면 어긋나고, **어디서 어긋나는지**
 *
 * 마지막 항목이 핵심이다. 그 어긋남이 yacc 에서
 * 중간 액션이나 전역 버퍼가 필요해지는 이유다.
 *
 * 입력 (한 줄에 하나)
 *   3 * 5 + 4          산술식  → 합성 속성 (val)
 *   int a, b, c        선언    → 상속 속성 (in)
 *
 *   ./attreval         평가 순서를 표로 출력
 *   ./attreval -t      의존 간선까지 함께 출력
 *
 *   cc -std=c11 -Wall -Wextra -O2 -o attreval attreval.c
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAXNODE 128
#define MAXATTR 128
#define MAXDEP    4
#define MAXKID    4

/* ══ 파스 트리 ═════════════════════════════════════════════ */
typedef struct {
    char sym[12];              /* E, T, F, D, L, num, id, ... */
    char lexeme[24];           /* 터미널의 실제 문자열 */
    int  kid[MAXKID];
    int  nkid;
} Node;

static Node nodes[MAXNODE];
static int nnode;

static int mknode(const char *sym, const char *lexeme)
{
    Node *n = &nodes[nnode];
    snprintf(n->sym, sizeof n->sym, "%s", sym);
    snprintf(n->lexeme, sizeof n->lexeme, "%s", lexeme ? lexeme : "");
    n->nkid = 0;
    return nnode++;
}

static void addkid(int parent, int child)
{
    nodes[parent].kid[nodes[parent].nkid++] = child;
}

/* ══ 속성 인스턴스 ═════════════════════════════════════════ */
enum { SYN, INH, ACT };
static const char *const KIND_NAME[] = { "합성", "상속", "액션" };

typedef struct {
    char name[24];             /* val, type, in, addtype(a) ... */
    int  node;
    int  kind;
    int  dep[MAXDEP];
    int  ndep;
    char rule[48];             /* 사람이 읽는 의미 규칙 */
    long ival;                 /* 수치 결과 (val 계산용) */
    char sval[32];             /* 표시용 값 */
    char who[24];              /* ACT 인 경우 대상 식별자 */
    int  done;
} Attr;

static Attr attrs[MAXATTR];
static int nattr;

static int mkattr(const char *name, int node, int kind, const char *rule)
{
    Attr *a = &attrs[nattr];
    snprintf(a->name, sizeof a->name, "%s", name);
    snprintf(a->rule, sizeof a->rule, "%s", rule);
    a->node = node;
    a->kind = kind;
    a->ndep = 0;
    a->done = 0;
    a->ival = 0;
    a->sval[0] = '\0';
    a->who[0] = '\0';
    return nattr++;
}

static void adddep(int a, int d) { attrs[a].dep[attrs[a].ndep++] = d; }

/* ══ 어휘 분석 (아주 단순하다) ═════════════════════════════ */
static const char *cursor;

static void skipws(void) { while (isspace((unsigned char)*cursor)) cursor++; }

static int peek(void) { skipws(); return (unsigned char)*cursor; }

static int eat_word(char *buf, size_t n)
{
    skipws();
    if (!isalpha((unsigned char)*cursor)) return 0;
    size_t k = 0;
    while (isalnum((unsigned char)*cursor) || *cursor == '_')
        if (k + 1 < n) buf[k++] = *cursor++; else cursor++;
    buf[k] = '\0';
    return 1;
}

/* ══ 산술식 — 합성 속성 ════════════════════════════════════
 *
 *   E → E + T   E.val := E₁.val + T.val
 *   E → T       E.val := T.val
 *   T → T * F   T.val := T₁.val × F.val
 *   T → F       T.val := F.val
 *   F → ( E )   F.val := E.val
 *   F → num     F.val := num.val   (어휘 분석기가 준다)
 */
static int parse_E(void);

/* 노드를 만들면서 그 노드의 val 속성도 함께 단다 */
static int attr_of(int node)
{
    for (int i = 0; i < nattr; i++)
        if (attrs[i].node == node && strcmp(attrs[i].name, "val") == 0) return i;
    return -1;
}

static int parse_F(void)
{
    skipws();
    if (*cursor == '(') {
        cursor++;
        int e = parse_E();
        if (e < 0) return -1;
        skipws();
        if (*cursor != ')') { printf("  오류: ')' 가 필요하다\n"); return -1; }
        cursor++;
        int f = mknode("F", NULL);
        int lp = mknode("(", "("), rp = mknode(")", ")");
        addkid(f, lp); addkid(f, e); addkid(f, rp);
        int a = mkattr("val", f, SYN, "F.val := E.val");
        adddep(a, attr_of(e));
        return f;
    }
    if (isdigit((unsigned char)*cursor)) {
        char *end;
        long v = strtol(cursor, &end, 10);
        char lex[24];
        snprintf(lex, sizeof lex, "%.*s", (int)(end - cursor), cursor);
        cursor = end;

        int num = mknode("num", lex);
        int na = mkattr("val", num, SYN, "어휘 분석기가 준다");
        attrs[na].ival = v;

        int f = mknode("F", NULL);
        addkid(f, num);
        int a = mkattr("val", f, SYN, "F.val := num.val");
        adddep(a, na);
        return f;
    }
    printf("  오류: 수나 '(' 가 필요하다\n");
    return -1;
}

static int parse_T(void)
{
    int left = parse_F();
    if (left < 0) return -1;
    {
        int t = mknode("T", NULL);
        addkid(t, left);
        int a = mkattr("val", t, SYN, "T.val := F.val");
        adddep(a, attr_of(left));
        left = t;
    }
    for (;;) {
        skipws();
        if (*cursor != '*') return left;
        cursor++;
        int right = parse_F();
        if (right < 0) return -1;
        int t = mknode("T", NULL);
        int op = mknode("*", "*");
        addkid(t, left); addkid(t, op); addkid(t, right);
        int a = mkattr("val", t, SYN, "T.val := T1.val * F.val");
        adddep(a, attr_of(left));
        adddep(a, attr_of(right));
        left = t;
    }
}

static int parse_E(void)
{
    int left = parse_T();
    if (left < 0) return -1;
    {
        int e = mknode("E", NULL);
        addkid(e, left);
        int a = mkattr("val", e, SYN, "E.val := T.val");
        adddep(a, attr_of(left));
        left = e;
    }
    for (;;) {
        skipws();
        if (*cursor != '+') return left;
        cursor++;
        int right = parse_T();
        if (right < 0) return -1;
        int e = mknode("E", NULL);
        int op = mknode("+", "+");
        addkid(e, left); addkid(e, op); addkid(e, right);
        int a = mkattr("val", e, SYN, "E.val := E1.val + T.val");
        adddep(a, attr_of(left));
        adddep(a, attr_of(right));
        left = e;
    }
}

/* ══ 선언 — 상속 속성 ══════════════════════════════════════
 *
 *   D → T L      L.in := T.type
 *   T → int      T.type := integer
 *   L → L₁ , id  L₁.in := L.in;  addtype(id.entry, L.in)
 *   L → id       addtype(id.entry, L.in)
 *
 * L 이 왼쪽 재귀이므로 `int a, b, c` 의 트리는
 * 가장 왼쪽 id(a) 가 가장 깊은 곳에 놓인다.
 */
static int parse_decl(const char *kw)
{
    /* 이름들을 먼저 모은다 */
    char names[16][24];
    int nname = 0;
    for (;;) {
        char id[24];
        if (!eat_word(id, sizeof id)) { printf("  오류: 식별자가 필요하다\n"); return -1; }
        if (nname >= 16) { printf("  오류: 이름이 너무 많다\n"); return -1; }
        snprintf(names[nname++], 24, "%s", id);
        if (peek() != ',') break;
        cursor++;
    }
    if (peek() != 0) { printf("  오류: ',' 나 줄 끝이 필요하다\n"); return -1; }

    /* T → int */
    int tn = mknode("T", NULL);
    addkid(tn, mknode(kw, kw));
    int ttype = mkattr("type", tn, SYN, "T.type := integer");
    snprintf(attrs[ttype].sval, sizeof attrs[ttype].sval, "%s",
             strcmp(kw, "int") == 0 ? "integer" : kw);

    /* L 을 안쪽(가장 왼쪽 이름)부터 바깥으로 쌓는다 */
    int inner = mknode("L", NULL);
    addkid(inner, mknode("id", names[0]));
    int inner_in  = mkattr("in", inner, INH, "L.in := (부모에게서)");
    int inner_act = mkattr("addtype", inner, ACT, "addtype(id.entry, L.in)");
    snprintf(attrs[inner_act].who, sizeof attrs[inner_act].who, "%s", names[0]);
    adddep(inner_act, inner_in);

    for (int i = 1; i < nname; i++) {
        int outer = mknode("L", NULL);
        addkid(outer, inner);
        addkid(outer, mknode(",", ","));
        addkid(outer, mknode("id", names[i]));

        int outer_in  = mkattr("in", outer, INH, "L.in := (부모에게서)");
        int outer_act = mkattr("addtype", outer, ACT, "addtype(id.entry, L.in)");
        snprintf(attrs[outer_act].who, sizeof attrs[outer_act].who, "%s", names[i]);
        adddep(outer_act, outer_in);

        /* 안쪽 L 의 in 은 바깥 L 의 in 에서 온다 */
        snprintf(attrs[inner_in].rule, sizeof attrs[inner_in].rule, "L1.in := L.in");
        adddep(inner_in, outer_in);

        inner = outer;
        inner_in = outer_in;
    }

    /* D → T L */
    int d = mknode("D", NULL);
    addkid(d, tn);
    addkid(d, inner);
    snprintf(attrs[inner_in].rule, sizeof attrs[inner_in].rule, "L.in := T.type");
    adddep(inner_in, ttype);
    return d;
}

/* ══ 후위 순회 순위 ════════════════════════════════════════ */
static int porank[MAXNODE];
static int pocount;

static void walk_post(int n)
{
    for (int i = 0; i < nodes[n].nkid; i++) walk_post(nodes[n].kid[i]);
    porank[n] = pocount++;
}

/* 어떤 노드가 다른 노드의 후손인가? */
static int descends(int maybe_child, int ancestor)
{
    if (maybe_child == ancestor) return 1;
    for (int i = 0; i < nodes[ancestor].nkid; i++)
        if (descends(maybe_child, nodes[ancestor].kid[i])) return 1;
    return 0;
}

/* ══ 평가 ══════════════════════════════════════════════════ */
static void compute(int i)
{
    Attr *a = &attrs[i];
    if (a->sval[0]) { a->done = 1; return; }          /* 미리 정해진 값 */

    if (a->kind == ACT) {
        /* addtype — 의존하는 in 의 값을 심볼 테이블에 적는다 */
        const char *ty = a->ndep ? attrs[a->dep[0]].sval : "?";
        snprintf(a->sval, sizeof a->sval, "%s : %s", a->who, ty);
        a->done = 1;
        return;
    }
    if (a->kind == INH) {
        snprintf(a->sval, sizeof a->sval, "%s", a->ndep ? attrs[a->dep[0]].sval : "?");
        a->done = 1;
        return;
    }
    /* SYN — val 계산 */
    if (a->ndep == 0)      a->ival = a->ival;
    else if (a->ndep == 1) a->ival = attrs[a->dep[0]].ival;
    else                   a->ival = strstr(a->rule, "*")
                                   ? attrs[a->dep[0]].ival * attrs[a->dep[1]].ival
                                   : attrs[a->dep[0]].ival + attrs[a->dep[1]].ival;
    snprintf(a->sval, sizeof a->sval, "%ld", a->ival);
    a->done = 1;
}

static int trace;

/* 한글은 터미널에서 두 칸을 차지한다. printf 의 %-Ns 는 바이트를 세므로
 * 한·영이 섞인 표가 어긋난다. 표시 폭을 직접 세어 채운다. */
static int dispwidth(const char *s)
{
    int w = 0;
    for (const unsigned char *p = (const unsigned char *)s; *p; ) {
        if (*p < 0x80)      { p += 1; w += 1; }
        else if (*p < 0xE0) { p += 2; w += 1; }   /* 2바이트 — 폭 1로 본다 */
        else if (*p < 0xF0) { p += 3; w += 2; }   /* 한글·CJK — 폭 2 */
        else                { p += 4; w += 2; }
    }
    return w;
}

static void padw(const char *s, int width)
{
    fputs(s, stdout);
    for (int i = dispwidth(s); i < width; i++) putchar(' ');
}

/* 위상 정렬해 순서대로 계산한다. 성공하면 1. */
static int evaluate(int root)
{
    pocount = 0;
    walk_post(root);

    /* 후위 순회로 되는가 — 모든 의존 대상이 자기 노드의 후손인가 */
    int postorder_ok = 1, bad = -1;
    for (int i = 0; i < nattr && postorder_ok; i++)
        for (int k = 0; k < attrs[i].ndep; k++) {
            int d = attrs[i].dep[k];
            if (attrs[d].node == attrs[i].node) continue;
            if (descends(attrs[d].node, attrs[i].node)) continue;
            postorder_ok = 0; bad = i; break;
        }

    printf("  후위 순회 한 번으로: %s\n", postorder_ok ? "가능 (S-속성)" : "불가능");
    if (!postorder_ok)
        printf("    막히는 곳: %s.%s 는 자기 후손 밖의 값을 필요로 한다\n",
               nodes[attrs[bad].node].sym, attrs[bad].name);

    printf("   # | ");
    padw("속성", 14);        printf(" | ");
    padw("종류", 4);         printf(" | ");
    padw("의미 규칙", 26);   printf(" | ");
    padw("값", 12);          printf(" | 후위\n");

    int indeg[MAXATTR] = {0};
    for (int i = 0; i < nattr; i++)
        for (int k = 0; k < attrs[i].ndep; k++) indeg[i]++;

    int emitted = 0;
    while (emitted < nattr) {
        /* 준비된 것 중 후위 순회 순위가 가장 낮은 것을 고른다.
         * 합성 속성만 있으면 이 규칙이 곧 후위 순회 순서를 재현한다. */
        int pick = -1;
        for (int i = 0; i < nattr; i++) {
            if (attrs[i].done || indeg[i] > 0) continue;
            if (pick < 0 || porank[attrs[i].node] < porank[attrs[pick].node]) pick = i;
        }
        if (pick < 0) { printf("  오류: 의존 그래프에 사이클이 있다\n"); return 0; }

        compute(pick);
        emitted++;

        char label[40];
        snprintf(label, sizeof label, "%s.%s", nodes[attrs[pick].node].sym, attrs[pick].name);
        printf("  %2d | ", emitted);
        padw(label, 14);                      printf(" | ");
        padw(KIND_NAME[attrs[pick].kind], 4); printf(" | ");
        padw(attrs[pick].rule, 26);           printf(" | ");
        padw(attrs[pick].sval, 12);           printf(" | %d\n", porank[attrs[pick].node]);

        if (trace)
            for (int k = 0; k < attrs[pick].ndep; k++)
                printf("     └ 필요했던 것: %s.%s\n",
                       nodes[attrs[attrs[pick].dep[k]].node].sym,
                       attrs[attrs[pick].dep[k]].name);

        /* 이 속성에 의존하던 것들의 차수를 줄인다 */
        for (int i = 0; i < nattr; i++)
            for (int k = 0; k < attrs[i].ndep; k++)
                if (attrs[i].dep[k] == pick) indeg[i]--;
    }
    return 1;
}

/* ══ main ══════════════════════════════════════════════════ */
int main(int argc, char **argv)
{
    for (int i = 1; i < argc; i++)
        if (strcmp(argv[i], "-t") == 0) trace = 1;

    char line[512];
    int ng = 0;

    while (fgets(line, sizeof line, stdin)) {
        line[strcspn(line, "\n")] = '\0';
        if (line[0] == '\0') continue;

        printf("입력: %s\n", line);
        fflush(stdout);

        nnode = nattr = 0;
        cursor = line;

        int root;
        char kw[24];
        const char *save = cursor;
        if (eat_word(kw, sizeof kw) && (strcmp(kw, "int") == 0 || strcmp(kw, "float") == 0)) {
            root = parse_decl(kw);
        } else {
            cursor = save;
            root = parse_E();
            if (root >= 0) { skipws(); if (*cursor) { printf("  오류: 남은 입력 '%s'\n", cursor); root = -1; } }
        }

        if (root < 0 || !evaluate(root)) ng++;
        printf("----\n");
        fflush(stdout);
    }

    if (ng == 0) printf("모두 정상 처리\n");
    else         printf("실패 %d건\n", ng);
    return ng ? 1 : 0;
}
