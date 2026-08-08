TARGET     := reentrant
CLEANFILES := tok.yy.c tok.yy.h

include ../common/rules.mk

# --header-file 로 yyscan_t 와 tk* 함수 선언을 얻는다.
tok.yy.c tok.yy.h: tok.l
	$(LEX) $(LFLAGS) --header-file=tok.yy.h -o tok.yy.c $<

$(TARGET): tok.yy.c tok.yy.h main.c
	$(CC) $(CFLAGS) -Wno-unused-parameter -Wno-sign-compare -o $@ tok.yy.c main.c
