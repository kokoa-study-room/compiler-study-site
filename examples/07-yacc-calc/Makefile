TARGET     := calc
CLEANFILES := calc.tab.c calc.tab.h lex.yy.c calc.output

include ../common/rules.mk

# bison 이 먼저 돌아 calc.tab.h 를 만들어야 flex 가 그것을 include 할 수 있다.
calc.tab.c calc.tab.h: calc.y
	$(YACC) $(YFLAGS) -v -o calc.tab.c calc.y

lex.yy.c: calc.l calc.tab.h
	$(LEX) $(LFLAGS) -o $@ calc.l

$(TARGET): calc.tab.c lex.yy.c
	$(CC) $(CFLAGS) -Wno-sign-compare -Wno-unused-function -o $@ calc.tab.c lex.yy.c -lm
