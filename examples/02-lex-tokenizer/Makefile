TARGET     := tokenizer
CLEANFILES := tokenizer.c

include ../common/rules.mk

tokenizer.c: tokenizer.l
	$(LEX) $(LFLAGS) -o $@ $<

$(TARGET): tokenizer.c
	$(CC) $(CFLAGS) -Wno-sign-compare -o $@ $<
