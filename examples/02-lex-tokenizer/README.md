# 02 · C 부분집합 토크나이저

실제 컴파일러의 어휘 분석기와 같은 구조. 토큰을 종류·줄 번호와 함께 출력한다.

## 보는 것

- **정규 정의**로 패턴을 쌓아 올리기 (`{letter}`, `{digit}`, `{id}` …)
- **최장 일치(longest match)** — `==` 가 `=` 두 개로 쪼개지지 않는다
  (`tests/longest-match.in` 참고)
- **규칙 순서** — 예약어를 `{id}` 보다 먼저 써야 하는 이유
- `%option yylineno` 로 줄 번호 추적
- **catch-all `.` 규칙**이 없으면 오류가 조용히 지나간다는 것

## 실행

```bash
make && make test
./tokenizer < tests/basic.in
./tokenizer < tests/errors.in        # 오류 진단
flex -v tokenizer.l 2>&1 | head      # 생성된 DFA 크기 확인
```
