TARGET     := wordcount
CLEANFILES := wordcount.c

include ../common/rules.mk

wordcount.c: wordcount.l
	$(LEX) $(LFLAGS) -o $@ $<

$(TARGET): wordcount.c
	$(CC) $(CFLAGS) -Wno-sign-compare -o $@ $<
