# 모든 예제가 공유하는 빌드·테스트 규칙.
#
# 각 예제의 Makefile 은 TARGET 과 필요한 소스 변수를 정의한 뒤 이 파일을 include 한다.
#
#   TARGET      만들어 낼 실행 파일 이름
#   CLEANFILES  clean 시 추가로 지울 파일
#
# 테스트 규약
#   tests/NAME.in        표준 입력으로 들어갈 내용
#   tests/NAME.expected  기대하는 표준 출력 + 표준 오류
#   tests/NAME.args      (선택) 프로그램에 넘길 명령행 인자
#
# 종료 코드까지 확인해야 하는 예제는 프로그램이 결과를 출력하도록 만들어
# expected 에 담는다. 테스트 하네스는 의도적으로 단순하게 유지한다.

CC       ?= cc
CFLAGS   ?= -std=c11 -Wall -Wextra -O2

# make 는 LEX=lex, YACC=yacc 를 내장 기본값으로 갖고 있어서 `?=` 로는 덮이지 않는다.
# 값이 "내장 기본값"일 때만 우리가 원하는 도구로 바꾼다.
# (환경 변수나 명령행으로 준 값은 그대로 존중한다.)
ifeq ($(origin LEX),default)
LEX := flex
endif
ifeq ($(origin YACC),default)
YACC := bison
endif

LFLAGS   ?=
YFLAGS   ?= -d

.PHONY: all test clean

all: $(TARGET)

test: $(TARGET)
	@ok=0; ng=0; \
	for in in tests/*.in; do \
	  name=`basename "$$in" .in`; \
	  exp="tests/$$name.expected"; \
	  argf="tests/$$name.args"; \
	  if [ -f "$$argf" ]; then set -- `cat "$$argf"`; else set -- ; fi; \
	  got=`./$(TARGET) "$$@" < "$$in" 2>&1`; \
	  if [ "$$got" = "`cat $$exp`" ]; then \
	    ok=`expr $$ok + 1`; printf '  ok    %s\n' "$$name"; \
	  else \
	    ng=`expr $$ng + 1`; printf '  FAIL  %s\n' "$$name"; \
	    printf '%s\n' "$$got" | diff -u "$$exp" - | sed 's/^/        /' || true; \
	  fi; \
	done; \
	printf '  --- %-22s %d passed, %d failed\n' "$(TARGET)" "$$ok" "$$ng"; \
	[ "$$ng" -eq 0 ]

clean:
	rm -f $(TARGET) $(CLEANFILES) lex.yy.c *.tab.c *.tab.h *.o *.output
