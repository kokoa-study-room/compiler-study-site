/* dfa.c — 유한 오토마타를 손으로 구현해 보기
 *
 * 이 예제가 보여 주는 것
 *   1. **전이표 구동**(table-driven) 방식 — flex 가 생성하는 코드의 원리
 *   2. **직접 코딩**(direct-coded) 방식 — re2c 가 생성하는 코드의 원리
 *   3. 둘이 항상 같은 답을 낸다는 것 (같은 DFA의 두 표현)
 *   4. 교안 5장의 (a|b)*abb DFA를 그대로 옮긴 코드
 *
 * 인식하는 수 문법
 *   INT    : [0-9]+
 *   FLOAT  : [0-9]+ "." [0-9]+ ( [eE] [+-]? [0-9]+ )?
 *          | [0-9]+ [eE] [+-]? [0-9]+
 *
 * 사용법
 *   ./dfa            한 줄에 하나씩 렉심을 읽어 분류표를 출력
 *   ./dfa -t         분류에 더해 상태 전이 과정을 추적 출력
 *
 *   cc -std=c11 -Wall -Wextra -O2 -o dfa dfa.c
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* ══════════════════════════════════════════════════════════
 * 1. 전이표 구동 방식 — 수 인식기
 * ══════════════════════════════════════════════════════════
 *
 * 상태의 의미
 *   S0    시작. 아직 아무것도 읽지 않음
 *   S1    정수부의 숫자를 읽는 중            → INT 로 수락
 *   S2    '.' 을 막 읽음. 소수부 숫자가 필요
 *   S3    소수부의 숫자를 읽는 중            → FLOAT 로 수락
 *   S4    'e'/'E' 를 막 읽음. 부호나 숫자 필요
 *   S5    지수의 부호를 막 읽음. 숫자 필요
 *   S6    지수의 숫자를 읽는 중              → FLOAT 로 수락
 *   DEAD  더 이상 어떤 입력으로도 수락될 수 없음 (죽은 상태)
 */
enum { S0, S1, S2, S3, S4, S5, S6, DEAD, NSTATES };

/* 입력 문자를 문자 클래스(전이표의 열)로 압축한다.
 * 128개 열 대신 5개 열이면 충분하다 — flex 의 "동등 클래스"와 같은 아이디어. */
enum { C_DIGIT, C_DOT, C_EXP, C_SIGN, C_OTHER, NCLASSES };

static int class_of(int c)
{
    if (c >= '0' && c <= '9')   return C_DIGIT;
    if (c == '.')               return C_DOT;
    if (c == 'e' || c == 'E')   return C_EXP;
    if (c == '+' || c == '-')   return C_SIGN;
    return C_OTHER;
}

static const char *const STATE_NAME[NSTATES] = {
    "S0", "S1", "S2", "S3", "S4", "S5", "S6", "DEAD"
};

/*        digit  dot   exp   sign  other  */
static const unsigned char DELTA[NSTATES][NCLASSES] = {
/* S0   */ {  S1, DEAD, DEAD, DEAD, DEAD },
/* S1   */ {  S1,   S2,   S4, DEAD, DEAD },
/* S2   */ {  S3, DEAD, DEAD, DEAD, DEAD },
/* S3   */ {  S3, DEAD,   S4, DEAD, DEAD },
/* S4   */ {  S6, DEAD, DEAD,   S5, DEAD },
/* S5   */ {  S6, DEAD, DEAD, DEAD, DEAD },
/* S6   */ {  S6, DEAD, DEAD, DEAD, DEAD },
/* DEAD */ {DEAD, DEAD, DEAD, DEAD, DEAD },
};

typedef enum { TK_INVALID = 0, TK_INT, TK_FLOAT } Kind;

static const char *const KIND_NAME[] = { "INVALID", "INT", "FLOAT" };

/* 상태마다 "여기서 입력이 끝나면 무엇으로 수락되는가" */
static const Kind ACCEPT[NSTATES] = {
/* S0 */ TK_INVALID,
/* S1 */ TK_INT,
/* S2 */ TK_INVALID,
/* S3 */ TK_FLOAT,
/* S4 */ TK_INVALID,
/* S5 */ TK_INVALID,
/* S6 */ TK_FLOAT,
/* DE */ TK_INVALID,
};

static Kind classify_table(const char *s, int trace)
{
    int state = S0;

    if (trace) printf("      시작 %s\n", STATE_NAME[state]);

    for (const char *p = s; *p; p++) {
        int cls  = class_of((unsigned char)*p);
        int next = DELTA[state][cls];
        if (trace)
            printf("      '%c' : %s -> %s\n", *p, STATE_NAME[state], STATE_NAME[next]);
        state = next;
        /* 죽은 상태에 빠지면 남은 입력을 봐도 결과가 달라지지 않는다.
         * 조기 종료는 순수한 최적화일 뿐 의미는 같다. */
        if (state == DEAD) break;
    }

    if (trace)
        printf("      끝   %s -> %s\n", STATE_NAME[state], KIND_NAME[ACCEPT[state]]);

    return ACCEPT[state];
}

/* ══════════════════════════════════════════════════════════
 * 2. 직접 코딩 방식 — 같은 DFA
 * ══════════════════════════════════════════════════════════
 *
 * 상태를 배열 인덱스가 아니라 **프로그램의 위치**로 표현한다.
 * 표 접근이 사라지므로 분기 예측과 캐시에 유리할 수 있다.
 * re2c 가 생성하는 코드가 이런 모양이다.
 */
static Kind classify_direct(const char *p)
{
#define DIGIT (*p >= '0' && *p <= '9')
#define EXPCH (*p == 'e' || *p == 'E')
#define SIGN  (*p == '+' || *p == '-')

    /* S0 — 진입점이므로 레이블이 필요 없다 */
    if (DIGIT) { p++; goto s1; }
    return TK_INVALID;

s1: if (DIGIT)     { p++; goto s1; }
    if (*p == '.') { p++; goto s2; }
    if (EXPCH)     { p++; goto s4; }
    return *p == '\0' ? TK_INT : TK_INVALID;

s2: if (DIGIT) { p++; goto s3; }
    return TK_INVALID;

s3: if (DIGIT) { p++; goto s3; }
    if (EXPCH) { p++; goto s4; }
    return *p == '\0' ? TK_FLOAT : TK_INVALID;

s4: if (DIGIT) { p++; goto s6; }
    if (SIGN)  { p++; goto s5; }
    return TK_INVALID;

s5: if (DIGIT) { p++; goto s6; }
    return TK_INVALID;

s6: if (DIGIT) { p++; goto s6; }
    return *p == '\0' ? TK_FLOAT : TK_INVALID;

#undef DIGIT
#undef EXPCH
#undef SIGN
}

/* ══════════════════════════════════════════════════════════
 * 3. 교안 5장의 (a|b)*abb DFA
 * ══════════════════════════════════════════════════════════
 *
 *   q0 --a--> q1        q0 --b--> q0
 *   q1 --a--> q1        q1 --b--> q2
 *   q2 --a--> q1        q2 --b--> q3
 *   q3 --a--> q1        q3 --b--> q0      (q3 이 유일한 종결 상태)
 */
static int abb_accepts(const char *s)
{
    /*                a   b  */
    static const int d[4][2] = {
        /* q0 */ { 1, 0 },
        /* q1 */ { 1, 2 },
        /* q2 */ { 1, 3 },
        /* q3 */ { 1, 0 },
    };
    int q = 0;
    for (const char *p = s; *p; p++) {
        if (*p == 'a')      q = d[q][0];
        else if (*p == 'b') q = d[q][1];
        else return 0;              /* 알파벳 밖의 문자 */
    }
    return q == 3;
}

/* ══════════════════════════════════════════════════════════ */

int main(int argc, char **argv)
{
    int trace = (argc > 1 && strcmp(argv[1], "-t") == 0);
    char line[256];
    int mismatches = 0;

    /* 표 머리글은 ASCII 로 둔다. printf 의 폭 지정자는 바이트 수를 세므로
     * 한글(UTF-8 다바이트)을 넣으면 열이 어긋난다.
     *   table  = 전이표 구동,  direct = 직접 코딩 */
    printf("%-16s %-9s %-9s %s\n", "lexeme", "table", "direct", "(a|b)*abb");
    printf("%-16s %-9s %-9s %s\n", "----------------", "---------", "---------", "---------");

    while (fgets(line, sizeof line, stdin)) {
        line[strcspn(line, "\r\n")] = '\0';
        if (line[0] == '\0') continue;

        if (trace) printf("[%s]\n", line);

        Kind a = classify_table(line, trace);
        Kind b = classify_direct(line);
        if (a != b) mismatches++;

        printf("%-16s %-9s %-9s %s\n",
               line, KIND_NAME[a], KIND_NAME[b],
               abb_accepts(line) ? "수락" : "거부");
    }

    printf("----\n");
    if (mismatches == 0)
        printf("두 구현의 결과가 모두 일치한다.\n");
    else
        printf("불일치 %d건 — 두 구현이 같은 DFA가 아니다!\n", mismatches);

    return mismatches == 0 ? 0 : 1;
}
