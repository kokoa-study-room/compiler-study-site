# 09 — 재진입 스캐너 (`%option reentrant`)

스캐너 인스턴스를 **여러 개 동시에** 굴린다.

지금까지의 예제는 `yytext`, `yyleng`, `yylineno`, `yyin` 을 전역 변수로 썼다.
그래서 스캐너가 한 번에 하나뿐이다. 이 예제는 그 제약을 없앤다.

관련 교안: [9.10 재진입 스캐너와 유니코드](../../site/docs/lex/writing-lex-files.md)

## 실행

```bash
make
printf 'one two 3\nfour 56\n' | ./reentrant
make test
```

## 출력

```
== 번갈아 읽기 ==
A: WORD   [alpha]     B: NUM    [99]
A: NUM    [12]        B: WORD   [gamma]
A: WORD   [beta]      B: OTHER  [?]
A: EOF    []          B: EOF    []

A: words=2 nums=1 other=0
B: words=1 nums=1 other=1

== 표준 입력 ==
C: words=3 nums=2 other=0
C: lines=2
```

**세 스캐너가 서로를 건드리지 않는다.**
A와 B는 서로 다른 문자열을 토큰 하나씩 번갈아 읽고,
C는 표준 입력을 따로 읽는다.

전역 변수를 쓰는 보통의 스캐너로는 첫 줄부터 불가능하다.
`tklex(a)` 가 채운 `yytext` 를 바로 다음 `tklex(b)` 가 덮어쓰기 때문이다.

## 무엇이 달라지는가

| | 기본 | `%option reentrant` |
|---|---|---|
| 스캐너 상태 | 전역 변수 | `yyscan_t` 핸들 |
| 초기화 | 없음 | `tklex_init(&sc)` |
| 정리 | 없음 | `tklex_destroy(sc)` |
| 호출 | `yylex()` | `tklex(sc)` |
| 입력 지정 | `yyin = fp` | `tkset_in(fp, sc)` / `tk_scan_string(s, sc)` |
| 사용자 데이터 | 전역 변수 | `YY_EXTRA_TYPE` + `tkset_extra` / `tkget_extra` |

`prefix="tk"` 때문에 이름이 `yy…` 가 아니라 `tk…` 다.
한 프로그램에 스캐너를 둘 이상 링크할 때 필요한 옵션으로,
재진입과는 별개의 문제다.

## 파일

| 파일 | 내용 |
|---|---|
| `tok.l` | 스캐너. `%option reentrant prefix="tk"` |
| `tok.h` | 토큰 코드와 스캐너별 사용자 데이터 `struct stats` |
| `main.c` | 스캐너 셋을 만들어 번갈아 돌린다 |

`--header-file=tok.yy.h` 로 `yyscan_t` 와 `tk*` 함수 선언을 얻는다.
재진입 모드에서는 이 헤더가 사실상 필수다.

## 직접 해 볼 것

1. `tok.l` 에서 `%option reentrant` 를 빼고 빌드해 보자.
   어떤 컴파일 오류가 몇 개 나는가?

2. `struct stats` 에 `longest` 필드를 추가하고,
   각 스캐너가 만난 가장 긴 단어의 길이를 기록하게 하라.
   전역 변수를 하나도 쓰지 않고 할 수 있어야 한다.

3. bison 파서와 결합하려면 파서도 재진입이어야 한다.
   `07-yacc-calc` 를 `%define api.pure full` 로 바꿔 보자
   (bison 2.4 이상 필요 — macOS 기본 bison 2.3에서는 `%pure-parser`).
