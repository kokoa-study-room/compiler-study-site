# 07 · flex + bison 계산기

두 도구를 처음으로 결합한다. 변수, 우선순위, 오류 복구까지.

## 보는 것

- **파서와 스캐너의 계약 셋** — 토큰 코드(`return NUM`),
  의미 값(`yylval`), 입력 끝(0 반환)
- **모호한 문법 + 우선순위 선언**이라는 실용적 접근.
  14장에서 손으로 계층화했던 `E/T/F` 대신 이렇게 쓴다.

  ```
  expr : expr '+' expr | expr '*' expr | ...
  ```

  이대로면 shift/reduce 충돌이 잔뜩 생기지만
  `%left` / `%right` 선언이 전부 해소해 **충돌 0개**로 빌드된다
- `%prec UMINUS` — 단항 마이너스의 우선순위를 따로 주는 법
- `error` 토큰을 이용한 **패닉 모드 복구** — 오류가 난 줄을 버리고 다음 줄부터 재개
- `%union` — 15장에서 본 값 스택의 원소 타입

## 실행

```bash
make && make test
./calc < tests/basic.in
./calc < tests/errors.in     # 오류 복구
bison -d -v -o calc.tab.c calc.y && less calc.output   # LALR 상태 전부
```

## 우선순위 선언 확인

```
2 ^ 3 ^ 2   →  512   (%right '^' — 우결합, 2^(3^2))
-2 ^ 2      →  -4    (UMINUS 가 '^' 보다 낮으므로 -(2^2))
-2 * 3      →  -6    (UMINUS 가 '*' 보다 높으므로 (-2)*3)
```

선언 순서를 바꿔 가며 결과가 어떻게 달라지는지 직접 확인해 보자.

## 줄 번호를 파서가 세는 이유

flex 의 `yylineno` 는 `\n` 을 매치하는 **즉시** 증가한다.
그런데 그 `\n`(EOL)은 파서가 lookahead 로 먼저 읽어 두므로,
`expr '/' expr` 같은 안쪽 축약이 실행되는 시점에는
`yylineno` 가 이미 다음 줄을 가리킨다.

그래서 이 예제는 한 줄을 다 처리한 뒤(`line` 규칙의 액션에서) 직접 센다.
제대로 하려면 bison 의 `%locations` 와 `YY_USER_ACTION` 을 쓴다.
