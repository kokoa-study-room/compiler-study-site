# 실습 예제

교안의 코드는 전부 이 디렉터리에서 실제로 빌드되고 테스트된다.
문서에 실린 코드 조각은 여기 있는 파일에서 가져온 것이다.

## 사용법

```bash
make          # 전체 빌드
make test     # 전체 테스트
make clean    # 생성물 삭제
```

개별 예제만 다루려면 해당 디렉터리에서 같은 명령을 쓴다.

```bash
cd 01-lex-wordcount
make && make test
./wordcount < tests/basic.in
```

## 목록

| 디렉터리 | 주제 | 관련 장 |
|---|---|---|
| `01-lex-wordcount` | lex 입력 파일의 3부 구조, `yytext`/`yyleng` | 7 · LEX |
| `02-lex-tokenizer` | C 부분집합 토크나이저, 최장 일치와 규칙 순서 | 8 · LEX 입력 및 파싱 |
| `03-dfa-by-hand` | 전이표 구동 / 직접 코딩 DFA를 손으로 작성 | 5 · 유한 오토마타 |
| `04-lex-states` | 시작 조건, 중첩 주석, 문자열 리터럴 | 9 · LEX 입력 파일 작성 |
| `05-recursive-descent` | 손으로 쓴 LL(1) 재귀 하강 파서 | 13 · LL 구문 분석 |
| `06-lr-table-driven` | 손으로 쓴 표 구동 LR 파서 | 15 · LR 파서의 구현 |
| `07-yacc-calc` | flex + bison 계산기 | 17 · YACC |
| `08-mini-compiler` | AST → 3-주소 코드 미니 컴파일러 | 통합 프로젝트 |

## 테스트 규약

각 예제의 `tests/` 아래에

- `NAME.in` — 표준 입력으로 넣을 내용
- `NAME.expected` — 기대하는 표준 출력 + 표준 오류
- `NAME.args` — (선택) 프로그램에 넘길 명령행 인자

를 두면 `make test` 가 자동으로 실행하고 `diff` 로 비교한다.
공통 규칙은 `common/rules.mk` 에 있다.

## 요구 사항

`flex`, `bison`, C 컴파일러, `make`.
설치는 교안의 [실습 환경 구성](../site/docs/labs/setup.md) 문서를 참고할 것.
