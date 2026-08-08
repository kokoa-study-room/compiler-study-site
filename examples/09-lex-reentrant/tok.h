#ifndef TOK_H
#define TOK_H

enum { T_EOF = 0, T_NUM = 1, T_WORD = 2, T_OTHER = 3 };

/* 스캐너마다 따로 갖는 사용자 데이터. 전역이 아니라는 것이 요점이다. */
struct stats {
    int nums, words, other, lines;
};

const char *tok_name(int t);

#endif
