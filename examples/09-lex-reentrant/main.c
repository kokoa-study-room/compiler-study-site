/*
 * 재진입 스캐너 두 개를 번갈아 돌린다.
 *
 * 전역 변수를 쓰는 보통의 flex 스캐너로는 이렇게 할 수 없다.
 * yytext, yyleng, yylineno 가 하나뿐이므로 두 번째 yylex() 호출이
 * 첫 번째의 상태를 덮어써 버린다.
 */
#include <stdio.h>
#include <string.h>
#include "tok.h"
#include "tok.yy.h"

const char *tok_name(int t)
{
    switch (t) {
    case T_NUM:   return "NUM";
    case T_WORD:  return "WORD";
    case T_OTHER: return "OTHER";
    default:      return "EOF";
    }
}

/* 스캐너 하나를 만들어 문자열에 붙인다. */
static void open_string(yyscan_t *sc, struct stats *st, const char *text)
{
    memset(st, 0, sizeof *st);
    tklex_init(sc);
    tkset_extra(st, *sc);
    tk_scan_string(text, *sc);
}

static void report(const char *label, const struct stats *st)
{
    printf("%s: words=%d nums=%d other=%d\n",
           label, st->words, st->nums, st->other);
}

int main(void)
{
    yyscan_t a, b;
    struct stats sa, sb;

    open_string(&a, &sa, "alpha 12 beta");
    open_string(&b, &sb, "99 gamma ?");

    /* 두 스캐너에서 토큰을 하나씩 번갈아 꺼낸다. */
    puts("== 번갈아 읽기 ==");
    for (int done = 0; done < 2; ) {
        int ta = tklex(a);
        int tb = tklex(b);

        char ba[32], bb[32];
        snprintf(ba, sizeof ba, "[%s]", ta ? tkget_text(a) : "");
        snprintf(bb, sizeof bb, "[%s]", tb ? tkget_text(b) : "");
        printf("A: %-6s %-9s   B: %-6s %s\n",
               tok_name(ta), ba, tok_name(tb), bb);

        done = (ta == T_EOF) + (tb == T_EOF);
        if (ta == T_EOF && tb == T_EOF) break;
    }

    puts("");
    report("A", &sa);
    report("B", &sb);

    tklex_destroy(a);
    tklex_destroy(b);

    /* 세 번째 스캐너는 표준 입력을 읽는다. 앞의 둘과 무관하다. */
    {
        yyscan_t c;
        struct stats sc;

        memset(&sc, 0, sizeof sc);
        tklex_init(&c);
        tkset_extra(&sc, c);
        tkset_in(stdin, c);
        while (tklex(c) != T_EOF)
            ;
        puts("");
        puts("== 표준 입력 ==");
        report("C", &sc);
        printf("C: lines=%d\n", sc.lines);
        tklex_destroy(c);
    }

    return 0;
}
