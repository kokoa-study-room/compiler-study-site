---
id: cheatsheet
title: 한 장 요약
sidebar_label: 한 장 요약
sidebar_position: 2
description: 알고리즘·표기·도구 옵션·흔한 실수를 한 곳에 모은 참조 시트.
---

# 한 장 요약

시험 직전이나 실제 작업 중에 찾아볼 요약이다.
설명은 최소한만 적었으니 자세한 것은 링크를 따라가자.

---

## 1. 계층과 도구의 대응

| 유형 | 문법 | 기계 | 판정 | 컴파일러 단계 | 도구 |
|---|---|---|---|---|---|
| 3 | $A \to aB \mid a$ | 유한 오토마타 | $O(n)$ | 어휘 분석 | **lex** |
| 2 | $A \to \alpha$ | 푸시다운 오토마타 | $O(n^3)$, DCFL은 $O(n)$ | 구문 분석 | **yacc** |
| 1 | $\alpha A \beta \to \alpha\gamma\beta$ | 선형 유계 오토마타 | PSPACE-완전 | (의미 분석) | 손코딩 |
| 0 | $\alpha \to \beta$ | 튜링 기계 | 결정 불가능 | — | — |

$$\text{LR(0)} \subsetneq \text{SLR(1)} \subsetneq \text{LALR(1)} \subsetneq \text{LR(1)} = \text{DCFL} \subsetneq \text{CFL}$$

$\text{LL(1)} \subsetneq \text{LR(1)}$ — **LR이 더 넓다.**

---

## 2. 표현력이 같은 다섯 가지

$$\text{정규 표현} \equiv \varepsilon\text{-NFA} \equiv \text{NFA} \equiv \text{DFA} \equiv \text{정규 문법}$$

| 변환 | 알고리즘 | 비용 |
|---|---|---|
| 정규 표현 → ε-NFA | Thompson 구성 | 상태 수 $\le 2n$, **선형** |
| ε-NFA → DFA | 부분집합 구성 | 최악 $2^n$ |
| DFA → 최소 DFA | 분할 정제 / Hopcroft | $O(n \log n \cdot \lvert \Sigma \rvert)$ |
| DFA → 정규 표현 | 상태 소거 | 결과 크기 최악 지수 |
| 정규 표현 → DFA | followpos (직행) | ε-NFA 생략 |

**부분집합 구성의 핵심 한 줄**

$$U = \varepsilon\text{-closure}(\text{move}(T, a))$$

---

## 3. FIRST / FOLLOW

**FIRST($\alpha$)** — $\alpha$ 가 유도하는 스트링의 첫 터미널.
$\alpha \Rightarrow^* \varepsilon$ 이면 $\varepsilon$ 포함.

```
X 가 터미널        →  FIRST(X) = {X}
X → ε              →  ε 추가
X → Y₁ … Yₖ        →  FIRST(Y₁) 의 ε 아닌 것 추가
                      ε ∈ FIRST(Y₁) 이면 FIRST(Y₂) 도 …
                      전부 nullable 이면 ε 추가
```

**FOLLOW($A$)** — $A$ 바로 뒤에 올 수 있는 터미널. **ε은 안 들어간다.**

```
FOLLOW(S) ∋ $
A → α B β          →  FIRST(β) 의 ε 아닌 것을 FOLLOW(B) 에
A → α B  (또는 ε ∈ FIRST(β))
                   →  FOLLOW(A) 전체를 FOLLOW(B) 에
```

**둘 다 고정점 계산이다** — 변화가 없을 때까지 반복.

---

## 4. LL(1)

**표 구성**

```
A → α 각각에 대해:
  FIRST(α) 의 터미널 a       →  M[A, a] = A → α
  ε ∈ FIRST(α) 이면
    FOLLOW(A) 의 터미널 b    →  M[A, b] = A → α
```

**LL(1) 조건** — 표의 어느 칸에도 규칙이 둘 이상 들어가지 않음.

**깨는 것**: 좌재귀, 공통 접두사, 모호성.

**좌재귀 제거**

$$A \to A\alpha \mid \beta \quad\Longrightarrow\quad A \to \beta A',\quad A' \to \alpha A' \mid \varepsilon$$

**좌인수분해**

$$A \to \alpha\beta_1 \mid \alpha\beta_2 \quad\Longrightarrow\quad A \to \alpha A',\quad A' \to \beta_1 \mid \beta_2$$

**구동 알고리즘**

```
스택 ← [$, S]
X = 스택 맨 위,  a = 현재 입력
  X = a = $        →  수락
  X 가 터미널       →  X = a 이면 팝 + 전진, 아니면 오류
  X 가 넌터미널     →  M[X,a] 우변을 역순으로 푸시
```

---

## 5. LR

**LR(0) 항목** — 우변에 점을 찍은 것. 점 왼쪽 = 스택, 점 오른쪽 = 기대.

**CLOSURE(I)** — $A \to \alpha \cdot B\beta \in I$ 이면 모든 $B \to \gamma$ 에 대해 $B \to \cdot\gamma$ 추가 (반복).

**GOTO(I, X)** — 점을 $X$ 너머로 옮긴 항목들의 CLOSURE.

**SLR(1) 표 구성**

```
A → α · a β ∈ Iᵢ,  GOTO(Iᵢ,a)=Ij   →  ACTION[i,a] = shift j
A → α ·      ∈ Iᵢ  (A ≠ S')        →  FOLLOW(A) 의 모든 a 에 reduce
S' → S ·     ∈ Iᵢ                  →  ACTION[i,$] = accept
GOTO(Iᵢ,A)=Ij (A 넌터미널)          →  GOTO[i,A] = j
```

**구동 알고리즘**

```
스택 ← [0]
s = 맨 위 상태,  a = 현재 입력
  shift t   →  a, t 푸시 + 입력 전진
  reduce A→β →  |β| 쌍을 팝, t = 맨 위 상태,
                A 와 GOTO[t,A] 푸시
  accept    →  성공
```

**네 변종**

| | lookahead | 상태 수 |
|---|---|---|
| LR(0) | 없음 | 적음 |
| SLR(1) | FOLLOW(A) — 너무 넓다 | LR(0)과 같음 |
| **LALR(1)** | 상태별 정확 | LR(0)과 같음 |
| LR(1) | 완전히 정확 | 수 배 |

LALR 병합은 **reduce/reduce 충돌**을 새로 만들 수 있다 (shift/reduce는 아니다).

---

## 5-b. 연산자 우선순위 파싱 (14장)

터미널 × 터미널 표 하나로 핸들의 **위치**만 찾는다. 상태가 없다.

|  | `+` | `*` | `(` | `)` | `id` | `$` |
|---|---|---|---|---|---|---|
| **`+`** | ⋗ | ⋖ | ⋖ | ⋗ | ⋖ | ⋗ |
| **`*`** | ⋗ | ⋗ | ⋖ | ⋗ | ⋖ | ⋗ |
| **`(`** | ⋖ | ⋖ | ⋖ | ≐ | ⋖ | |
| **`)`** | ⋗ | ⋗ | | ⋗ | | ⋗ |
| **`id`** | ⋗ | ⋗ | | ⋗ | | ⋗ |
| **`$`** | ⋖ | ⋖ | ⋖ | | ⋖ | |

```
a ⋖ b 또는 a ≐ b  →  이동
a ⋗ b            →  ⋖ 를 만날 때까지 걷어 낸다 (= 핸들)
빈 칸             →  구문 오류
```

- $a$ 는 스택 맨 위 **터미널** (넌터미널은 건너뛴다)
- 우선순위가 높으면 ⋖, 낮으면 ⋗ / 같으면 좌결합 ⋗, 우결합 ⋖
- **한계** 연산자 문법만 · 넌터미널 구별 못 함 · 단항 마이너스 · 잘못된 입력 수락

---

## 5-c. 속성과 계산 순서 (17장)

| | 어디서 어디로 | 계산 순서 | 도구 |
|---|---|---|---|
| **합성 속성** | 자식 → 부모 (위로) | **후위 순회** 한 번 | yacc `$$ = f($1, $3)` |
| **상속 속성** | 부모·왼쪽 형제 → 자식 (아래·옆으로) | 후위 순회로 안 됨 | 중간 액션 / 전역 버퍼 |

```
S-속성  ⊊  L-속성  ⊊  일반 SDD
   ↑         ↑
 LR 그대로  LL 자연스럽게
```

- **의존 그래프**에 사이클이 없으면 위상 정렬이 곧 계산 순서
- 임의 SDD의 사이클 판정은 **지수 시간** → 처음부터 S/L-속성으로 제한한다
- **LR 액션 실행 순서 = 후위 순회.** 그래서 합성 속성은 파싱 중에 끝난다

---

## 6. lex 요약

**파일 구조**

```
정의부  (%option, %{ %}, 정규 정의, %x)
%%
규칙부  (패턴은 반드시 1열에서 시작!)
%%
사용자 코드부
```

**매치 규칙 — 순서가 있다**

1. **최장 일치** — 더 긴 것
2. **규칙 우선순위** — 길이가 같으면 먼저 쓴 것

**핵심 변수/함수**

| 이름 | 뜻 |
|---|---|
| `yytext` / `yyleng` | 매치된 문자열 / 길이 (**다음 매치 때 덮어쓰임 — 복사할 것**) |
| `yylineno` | 줄 번호 (`%option yylineno`) |
| `BEGIN(sc)` | 시작 조건 전환 |
| `yyless(n)` | 앞 n글자만 소비 |
| `yymore()` | 다음 매치를 이어 붙임 |
| `REJECT` | 차선 규칙 시도 (**스캐너 전체가 느려진다**) |
| `<<EOF>>` | 파일 끝 규칙 |

**주요 옵션**

```bash
flex -v foo.l    # NFA/DFA 상태 수
flex -T foo.l    # NFA/DFA 구성 과정 전체 덤프
flex -d foo.l    # 실행 중 매치 규칙 추적
flex -s foo.l    # 기본 규칙이 쓰이면 경고
flex -b foo.l    # 되감기 보고서 (lex.backup)
flex -Cf foo.l   # 압축 없이 최대 속도
```

```c
%option noyywrap yylineno warn nodefault noinput nounput
```

---

## 7. yacc 요약

**파일 구조**

```
선언부  (%{ %}, %union, %token, %type, %left/%right, %expect)
%%
규칙부  (넌터미널 : 대안 | 대안 ;)
%%
사용자 코드부
```

**의미 값**

| 표기 | 뜻 |
|---|---|
| `$$` | 좌변의 값 |
| `$n` | 우변 n번째 심볼의 값 = `val_stack[sp - (k - n)]` |
| `@$`, `@n` | 위치 (`%locations`) |
| 기본 액션 | `{ $$ = $1; }` — **첫 심볼이 아니면 반드시 명시** |

**우선순위 — 아래로 갈수록 높다**

```c
%right '='
%left  '+' '-'
%left  '*' '/'
%right UMINUS
%right '^'
```

충돌 시 **규칙의 마지막 터미널** vs **lookahead 토큰** 비교:

| | 선택 |
|---|---|
| 토큰이 높다 | shift |
| 규칙이 높다 | reduce |
| 같고 `%left` | reduce |
| 같고 `%right` | shift |
| 같고 `%nonassoc` | 오류 |

**충돌**

| | 기본 해결 | 심각도 |
|---|---|---|
| shift/reduce | **shift** | 대개 괜찮다 (dangling else) |
| reduce/reduce | **먼저 쓴 규칙** | 거의 항상 버그 |

**오류 복구**

```c
stmt : error ';'   { yyerrok; }
```

| 매크로 | 하는 일 |
|---|---|
| `yyerrok` | 복구 완료 선언 |
| `yyclearin` | lookahead 버리기 |
| `YYABORT` / `YYACCEPT` | 즉시 종료 |

**주요 옵션**

```bash
bison -d foo.y                  # foo.tab.h 생성 (lex 공유용)
bison -v foo.y                  # foo.output — 모든 상태와 항목
bison -t foo.y                  # yydebug 지원
bison -Wcounterexamples foo.y   # 충돌 반례 생성 (3.8+)
bison -g foo.y                  # Graphviz .dot 출력
```

**Makefile 의존 순서 — 이것을 빼먹지 말 것**

```make
foo.tab.c foo.tab.h: foo.y
	bison -d -v -o foo.tab.c foo.y

lex.yy.c: foo.l foo.tab.h        # ← foo.tab.h 의존이 핵심
	flex -o $@ foo.l
```

---

## 8. 흔한 실수

### lex

| 실수 | 증상 |
|---|---|
| 패턴을 들여씀 | C 코드로 복사됨 |
| 규칙부 1열에 주석 | 패턴으로 해석 |
| `[0-9]*` (`+` 대신 `*`) | 빈 매치 → **무한 루프** |
| 예약어를 `{id}` 뒤에 | `rule cannot be matched` |
| `yytext` 복사 안 함 | 나중에 값이 깨짐 |
| catch-all `.` 없음 | 기본 규칙이 **조용히** 출력 |
| 시작 조건에 catch-all 없음 | 같은 문제 |
| `.` 이 개행 포함이라 착각 | 여러 줄 매치 실패 |
| `"/*".*"*/"` | 최장 일치로 여러 주석을 통째로 삼킴 |

### yacc

| 실수 | 증상 |
|---|---|
| `%union` 없이 포인터 사용 | `int` 로 잘림 |
| `%type` 누락/오지정 | **조용히** 잘못된 멤버 읽음 |
| `'{' list '}'` 에 기본 액션 | `$1` 즉 `'{'` 값이 들어감 |
| 중간 액션 사용 | `$n` 번호가 밀리고 충돌 발생 |
| 우재귀 리스트 | 스택 $O(n)$ |
| `.tab.h` 의존 누락 | 병렬 빌드에서 간헐적 실패 |
| 충돌 무시 | 의도와 다른 해석 |
| `error` 규칙 남발 | 새 충돌 발생 |

### 이론

| 실수 | 바로잡기 |
|---|---|
| $\varepsilon$ 과 $\emptyset$ 혼동 | 스트링 vs 빈 언어 |
| FOLLOW에 ε 넣기 | 대신 `$` |
| 펌핑 보조정리로 "정규임"을 증명 | **아님을 증명할 때만** 쓸 수 있다 |
| NFA 종결 상태 뒤집어 여집합 | **DFA에서만** 성립, 완전해야 함 |
| LL에 좌재귀 | 무한 루프 |
| LR에 우재귀 리스트 | 스택 폭증 |

---

## 9. 진단 명령 모음

```bash
# 어휘 분석기의 규모
flex -v scanner.l 2>&1 | grep -E "NFA|DFA states"

# 어느 규칙이 매치되는지
flex -d -o s.c scanner.l && cc -w -o s s.c && echo "입력" | ./s

# 되감기가 나는 곳
flex -b scanner.l && head -20 lex.backup

# 파서의 모든 상태
bison -v -d parser.y && less parser.output

# 충돌 상태만
grep -n "conflict" parser.output

# 버려진 액션 (충돌 지점)
grep -n '\[' parser.output

# 충돌 반례 (bison 3.8+)
bison -Wcounterexamples -v parser.y

# 오토마타를 그림으로
bison -g parser.y && dot -Tpng parser.dot -o parser.png

# 파싱 과정 추적
bison -t parser.y     # 그리고 코드에서 yydebug = 1;
```

---

## 10. 예제 디렉터리 색인

| 디렉터리 | 주제 | 장 |
|---|---|---|
| `01-lex-wordcount` | lex 3부 구조 | [7](/docs/lex/lex-overview) |
| `02-lex-tokenizer` | 최장 일치·규칙 순서 | [8](/docs/lex/lex-input-and-parsing) |
| `03-dfa-by-hand` | 표 구동 vs 직접 코딩 DFA | [5](/docs/regular/finite-automata) |
| `04-lex-states` | 시작 조건·중첩 주석 | [9](/docs/lex/writing-lex-files) |
| `05-recursive-descent` | 손코딩 LL(1) | [13](/docs/parsing/ll-parsing) |
| `06-lr-table-driven` | 손코딩 표 구동 LR | [16](/docs/parsing/lr-parser-implementation) |
| `07-yacc-calc` | flex + bison | [18](/docs/yacc/yacc-overview), [20](/docs/yacc/conflicts-and-precedence) |
| `08-mini-compiler` | 통합 — 3-주소 코드까지 | [19](/docs/yacc/yacc-grammar-and-actions) |
| `09-lex-reentrant` | 재진입 스캐너 (`%option reentrant`) | [9](/docs/lex/writing-lex-files#910-재진입-스캐너와-유니코드) |
| `10-operator-precedence` | 우선 관계 표 구동 파서 | [14](/docs/parsing/operator-precedence) |
| `11-attribute-eval` | 속성 평가 순서 (위상 정렬) | [17](/docs/parsing/syntax-directed-translation) |

```bash
cd examples && make && make test
```

