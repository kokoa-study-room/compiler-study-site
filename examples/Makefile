# 전체 예제의 빌드/테스트 진입점.
#
#   make          모든 예제 빌드
#   make test     모든 예제 테스트
#   make clean    모든 생성물 삭제
#
# 개별 예제만 다루려면 해당 디렉터리에서 같은 명령을 쓰면 된다.

SUBDIRS := $(patsubst %/Makefile,%,$(wildcard [0-9]*/Makefile))

.PHONY: all test clean $(SUBDIRS)

all:
	@for d in $(SUBDIRS); do \
	  printf '\n== build %s\n' "$$d"; \
	  $(MAKE) --no-print-directory -C "$$d" || exit 1; \
	done

test:
	@fail=0; \
	for d in $(SUBDIRS); do \
	  printf '\n== test %s\n' "$$d"; \
	  $(MAKE) --no-print-directory -C "$$d" test || fail=1; \
	done; \
	printf '\n'; \
	if [ "$$fail" -eq 0 ]; then \
	  echo "모든 예제 테스트 통과"; \
	else \
	  echo "실패한 예제가 있다"; exit 1; \
	fi

clean:
	@for d in $(SUBDIRS); do $(MAKE) --no-print-directory -C "$$d" clean; done
