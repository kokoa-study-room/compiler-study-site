TARGET     := states
CLEANFILES := states.c

include ../common/rules.mk

states.c: states.l
	$(LEX) $(LFLAGS) -o $@ $<

$(TARGET): states.c
	$(CC) $(CFLAGS) -Wno-sign-compare -o $@ $<
