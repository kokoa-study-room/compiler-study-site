TARGET     := minic
CLEANFILES := mini.tab.c mini.tab.h lex.yy.c mini.output

include ../common/rules.mk

mini.tab.c mini.tab.h: mini.y mini.h
	$(YACC) $(YFLAGS) -v -o mini.tab.c mini.y

lex.yy.c: mini.l mini.tab.h mini.h
	$(LEX) $(LFLAGS) -o $@ mini.l

$(TARGET): mini.tab.c lex.yy.c mini.c mini.h
	$(CC) $(CFLAGS) -Wno-sign-compare -Wno-unused-function -o $@ mini.tab.c lex.yy.c mini.c
