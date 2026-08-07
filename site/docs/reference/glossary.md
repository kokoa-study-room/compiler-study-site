---
id: glossary
title: 용어 사전
sidebar_label: 용어 사전
sidebar_position: 1
description: 교안에 나온 용어의 한국어·영어 대조와 짧은 정의, 해당 장 링크.
---

# 용어 사전

교안에 나온 용어를 한자리에 모았다.
영어 표기는 원자료를 찾을 때 필요하므로 함께 적었다.

---

## 형식 언어

| 한국어 | 영어 | 뜻 | 장 |
|---|---|---|---|
| 알파벳 | alphabet | 기호의 유한 집합 $\Sigma$ | [2](/docs/foundations/language-and-grammar#21-알파벳-스트링-언어) |
| 스트링 | string | 알파벳 기호의 유한 나열 | [2](/docs/foundations/language-and-grammar#21-알파벳-스트링-언어) |
| 공 스트링 | empty string | 길이 0인 스트링 $\varepsilon$ | [2](/docs/foundations/language-and-grammar#21-알파벳-스트링-언어) |
| 언어 | language | $\Sigma^*$ 의 부분집합 | [2](/docs/foundations/language-and-grammar#21-알파벳-스트링-언어) |
| 접합 | concatenation | 이어 붙이기 | [2](/docs/foundations/language-and-grammar#21-알파벳-스트링-언어) |
| 클레이니 클로저 | Kleene closure | $L^* = \bigcup_{i \ge 0} L^i$ | [2](/docs/foundations/language-and-grammar#21-알파벳-스트링-언어) |
| 문법 | grammar | $G = (V_N, V_T, P, S)$ | [2](/docs/foundations/language-and-grammar#22-문법) |
| 넌터미널 | nonterminal | 문법 변수 | [2](/docs/foundations/language-and-grammar#22-문법) |
| 터미널 | terminal | 언어의 실제 기호 | [2](/docs/foundations/language-and-grammar#22-문법) |
| 생성 규칙 | production | $A \to \alpha$ | [2](/docs/foundations/language-and-grammar#22-문법) |
| 유도 | derivation | 규칙을 적용해 문장을 만드는 과정 | [2](/docs/foundations/language-and-grammar#유도) |
| 좌측 유도 | leftmost derivation | 항상 가장 왼쪽 넌터미널을 전개 | [2](/docs/foundations/language-and-grammar#좌측-유도와-우측-유도) |
| 우측 유도 | rightmost derivation | 항상 가장 오른쪽 넌터미널을 전개 | [2](/docs/foundations/language-and-grammar#좌측-유도와-우측-유도) |
| 문장 형태 | sentential form | 유도 중간의 심볼 열 | [2](/docs/foundations/language-and-grammar#유도) |
| 파스 트리 | parse tree | 유도의 구조만 남긴 트리 | [2](/docs/foundations/language-and-grammar#23-파스-트리) |
| 모호성 | ambiguity | 한 문장에 파스 트리가 둘 이상 | [2](/docs/foundations/language-and-grammar#24-모호성) |
| 촘스키 계층 | Chomsky hierarchy | 유형 0~3 문법 분류 | [11](/docs/parsing/grammar-hierarchy) |

---

## 정규언어와 오토마타

| 한국어 | 영어 | 뜻 | 장 |
|---|---|---|---|
| 정규언어 | regular language | 정규 표현으로 표현되는 언어 | [3](/docs/regular/regular-languages) |
| 정규 문법 | regular grammar | 우선형/좌선형 문법 (유형 3) | [3](/docs/regular/regular-languages#32-정규-문법) |
| 폐포 성질 | closure property | 연산 결과가 같은 부류에 남는 성질 | [3](/docs/regular/regular-languages#33-정규언어의-폐포-성질) |
| 펌핑 보조정리 | pumping lemma | "정규가 아님"을 증명하는 도구 | [3](/docs/regular/regular-languages#펌핑-보조정리) |
| 정규 표현 | regular expression | 정규집합의 표기법 | [4](/docs/regular/regular-expressions) |
| 정규 정의 | regular definition | 이름 붙인 정규 표현의 나열 | [4](/docs/regular/regular-expressions#44-정규-정의) |
| 후행 문맥 | trailing context | `r/s` — 뒤따를 때만 매치, 소비는 안 함 | [4](/docs/regular/regular-expressions#45-lexflex의-정규-표현-문법) |
| 유한 오토마타 | finite automaton | 상태 유한, 기억 장치 없음 | [5](/docs/regular/finite-automata) |
| DFA | deterministic FA | 전이가 유일 | [5](/docs/regular/finite-automata#51-결정적-유한-오토마타-dfa) |
| NFA | nondeterministic FA | 전이가 집합 | [5](/docs/regular/finite-automata#52-비결정적-유한-오토마타-nfa) |
| ε-전이 | epsilon transition | 입력을 읽지 않는 전이 | [5](/docs/regular/finite-automata#53-ε-전이) |
| ε-closure | epsilon closure | ε 로만 도달 가능한 상태 전부 | [5](/docs/regular/finite-automata#53-ε-전이) |
| 죽은 상태 | dead / trap state | 어떤 입력으로도 수락될 수 없는 상태 | [5](/docs/regular/finite-automata#완전성과-죽은-상태) |
| Thompson 구성 | Thompson's construction | 정규 표현 → ε-NFA | [6](/docs/regular/representations#62-정규-표현--nfa-thompson-구성) |
| 부분집합 구성 | subset construction | NFA → DFA | [6](/docs/regular/representations#63-nfa--dfa-부분집합-구성) |
| 분할 정제 | partition refinement | DFA 최소화 알고리즘 | [6](/docs/regular/representations#64-dfa-최소화) |
| Myhill–Nerode 정리 | Myhill–Nerode theorem | 최소 DFA의 유일성 | [6](/docs/regular/representations#myhillnerode-관계) |
| 상태 소거 | state elimination | DFA → 정규 표현 | [6](/docs/regular/representations#65-dfa--정규-표현-상태-소거법) |
| followpos | followpos | 정규 표현에서 DFA 직행 | [6](/docs/regular/representations#67-정규-표현--dfa-직행-followpos) |

---

## 어휘 분석

| 한국어 | 영어 | 뜻 | 장 |
|---|---|---|---|
| 어휘 분석 | lexical analysis | 문자 → 토큰 | [1](/docs/foundations/compiler-overview#-어휘-분석-lexical-analysis) |
| 스캐너 / 토크나이저 | scanner / tokenizer | 어휘 분석기 | [1](/docs/foundations/compiler-overview#-어휘-분석-lexical-analysis) |
| 토큰 | token | 의미 있는 최소 단위 | [1](/docs/foundations/compiler-overview#-어휘-분석-lexical-analysis) |
| 렉심 | lexeme | 토큰에 대응하는 실제 문자열 | [7](/docs/lex/lex-overview) |
| 최장 일치 | longest match / maximal munch | 가장 긴 매치를 택한다 | [8](/docs/lex/lex-input-and-parsing#최장-일치) |
| 규칙 우선순위 | rule priority | 길이가 같으면 먼저 쓴 규칙 | [8](/docs/lex/lex-input-and-parsing#규칙-우선순위) |
| 되감기 | backtracking | 마지막 수락 지점으로 되돌아가기 | [8](/docs/lex/lex-input-and-parsing#되감기backtracking) |
| 시작 조건 | start condition | 스캐너의 모드 (`%x`) | [9](/docs/lex/writing-lex-files#92-시작-조건) |
| 기본 규칙 | default rule | 매치 안 되면 그대로 출력 | [7](/docs/lex/lex-overview#72-lex-입력-파일의-구조) |
| 동등 클래스 | equivalence class | 전이가 같은 문자를 한 열로 압축 | [6](/docs/regular/representations) |

---

## 구문 분석

| 한국어 | 영어 | 뜻 | 장 |
|---|---|---|---|
| 구문 분석 | syntax analysis / parsing | 토큰 → 구조 | [12](/docs/parsing/syntax-analysis) |
| 문맥 자유 문법 | context-free grammar (CFG) | 좌변이 넌터미널 하나 (유형 2) | [10](/docs/parsing/context-free-grammar) |
| 푸시다운 오토마타 | pushdown automaton (PDA) | 유한 오토마타 + 스택 | [10](/docs/parsing/context-free-grammar#103-푸시다운-오토마타) |
| 결정적 CFL | deterministic CFL (DCFL) | LR(1)이 인식하는 언어 부류 | [10](/docs/parsing/context-free-grammar#결정적-pda) |
| 좌재귀 | left recursion | $A \to A\alpha$ | [10](/docs/parsing/context-free-grammar#좌재귀-제거) |
| 좌인수분해 | left factoring | 공통 접두사 뽑아내기 | [10](/docs/parsing/context-free-grammar#좌인수분해) |
| 하향식 파싱 | top-down parsing | 시작 심볼에서 전개 (LL) | [12](/docs/parsing/syntax-analysis#121-두-가지-전략) |
| 상향식 파싱 | bottom-up parsing | 토큰에서 축약 (LR) | [12](/docs/parsing/syntax-analysis#121-두-가지-전략) |
| AST | abstract syntax tree | 의미에 필요한 것만 남긴 트리 | [12](/docs/parsing/syntax-analysis#파스-트리-vs-ast) |
| CST | concrete syntax tree | 문법의 모든 세부를 담은 트리 | [12](/docs/parsing/syntax-analysis#파스-트리-vs-ast) |
| FIRST | FIRST set | 첫 터미널이 될 수 있는 것들 | [12](/docs/parsing/syntax-analysis#123-first-집합) |
| FOLLOW | FOLLOW set | 바로 뒤에 올 수 있는 터미널들 | [12](/docs/parsing/syntax-analysis#124-follow-집합) |
| 고정점 계산 | fixed-point computation | 변화가 없을 때까지 반복 | [12](/docs/parsing/syntax-analysis#123-first-집합) |
| 재귀 하강 | recursive descent | 넌터미널마다 함수 | [13](/docs/parsing/ll-parsing#131-재귀-하강-파싱) |
| 예측 파싱 | predictive parsing | 표 구동 LL | [13](/docs/parsing/ll-parsing#132-표-구동-예측-파싱) |
| 이동 | shift | 토큰을 스택에 밀어 넣기 | [14](/docs/parsing/lr-parsing#141-이동-축약-파싱) |
| 축약 | reduce | 우변을 좌변으로 바꾸기 | [14](/docs/parsing/lr-parsing#141-이동-축약-파싱) |
| 핸들 | handle | 지금 축약해야 할 부분 | [14](/docs/parsing/lr-parsing#핸들) |
| LR(0) 항목 | LR(0) item | 우변에 점을 찍은 것 | [14](/docs/parsing/lr-parsing#142-lr0-항목) |
| 정준 항목 집합 | canonical collection | CLOSURE/GOTO 로 만든 상태 집합 | [14](/docs/parsing/lr-parsing#143-정준-lr0-항목-집합) |
| 실행 가능한 접두사 | viable prefix | 스택에 쌓일 수 있는 심볼 열 | [14](/docs/parsing/lr-parsing#143-정준-lr0-항목-집합) |
| 증강 문법 | augmented grammar | $S' \to S$ 를 추가한 문법 | [14](/docs/parsing/lr-parsing#증강-문법) |
| 충돌 | conflict | 표 한 칸에 액션이 둘 이상 | [14](/docs/parsing/lr-parsing#146-충돌) |
| dangling else | dangling else | `else` 가 어느 `if` 에 붙는가 | [18](/docs/yacc/conflicts-and-precedence#184-dangling-else) |
| GLR | generalized LR | 충돌 시 모든 가능성 탐색 | [15](/docs/parsing/lr-parser-implementation#158-glr--충돌을-포기하지-않기) |
| 기본 축약 | default reduction | 표 압축 기법 (`$default`) | [15](/docs/parsing/lr-parser-implementation#156-표-압축) |
| 패닉 모드 | panic mode | 동기화 토큰까지 버리는 오류 복구 | [12](/docs/parsing/syntax-analysis#126-구문-오류-처리) |

---

## 의미 분석과 코드 생성

| 한국어 | 영어 | 뜻 | 장 |
|---|---|---|---|
| 의미 분석 | semantic analysis | 타입·선언 검사 | [1](/docs/foundations/compiler-overview#-의미-분석-semantic-analysis) |
| 심볼 테이블 | symbol table | 이름 → 속성 매핑 | [17](/docs/yacc/yacc-grammar-and-actions#174-심볼-테이블) |
| 형 변환 | type coercion | 암묵적 타입 변환 | [17](/docs/yacc/yacc-grammar-and-actions#형-변환-노드-삽입) |
| 중간 표현 | intermediate representation (IR) | 기계 독립 표현 | [1](/docs/foundations/compiler-overview#-중간-코드-생성) |
| 3-주소 코드 | three-address code | 연산자 1개, 피연산자 최대 3개 | [1](/docs/foundations/compiler-overview#-중간-코드-생성) |
| 상수 접기 | constant folding | 컴파일 시점 계산 | [1](/docs/foundations/compiler-overview#-코드-최적화) |
| 단축 평가 | short-circuit evaluation | `&&`, `||` 의 조기 종료 | [통합](/docs/labs/mini-compiler#5-확장-과제) |
| 백패칭 | backpatching | 점프 대상을 나중에 채우기 | [17](/docs/yacc/yacc-grammar-and-actions#176-중간-코드-생성) |

---

## 도구

| 이름 | 정체 | 장 |
|---|---|---|
| lex / flex | 어휘 분석기 생성기 | [7](/docs/lex/lex-overview) |
| yacc / bison | LALR(1) 파서 생성기 | [16](/docs/yacc/yacc-overview) |
| re2c | 직접 코드 생성 스캐너 생성기 | [20](/docs/modern/toolchain-map#re2c) |
| RE-flex | 유니코드 지원 flex 대안 | [20](/docs/modern/toolchain-map#reflex) |
| ANTLR 4 | ALL(\*) 파서 생성기 | [20](/docs/modern/toolchain-map#antlr-4) |
| tree-sitter | 점진적 GLR 파서 (에디터용) | [19](/docs/modern/trends#tree-sitter--glr-기반-점진적-파싱) |
| Menhir | 검증된 LR(1) 파서 생성기 (OCaml) | [20](/docs/modern/toolchain-map#menhir-ocaml) |
| LLVM | 컴파일러 백엔드 인프라 | [20](/docs/modern/toolchain-map#llvm) |
| MLIR | 다층 dialect IR | [19](/docs/modern/trends#194-mlir--여러-층의-ir) |
| CompCert | 형식 검증된 C 컴파일러 | [19](/docs/modern/trends#196-검증된-컴파일러) |

---

## 자주 헷갈리는 짝

| 구분 | 차이 |
|---|---|
| $\varepsilon$ vs $\{\varepsilon\}$ vs $\emptyset$ | 스트링 / 원소 1개인 언어 / 원소 0개인 언어 |
| `ab*` vs `(ab)*` | `a` 뒤에 `b` 여럿 / `ab` 를 통째로 반복 |
| `r+` vs `r*` | 1회 이상 / 0회 이상 |
| FIRST vs FOLLOW | 앞에 올 수 있는 것 / 뒤에 올 수 있는 것 |
| FOLLOW에 ε | **들어가지 않는다.** 대신 `$` |
| LL vs LR | 좌측 유도 / 우측 유도의 역 |
| LL의 좌재귀 | **금지** (무한 루프) |
| LR의 좌재귀 | **권장** (스택이 안 자란다) |
| 토큰 vs 렉심 | 종류(`ID`) / 실제 문자열(`count`) |
| 파스 트리 vs AST | 모든 세부 / 의미만 |
| shift/reduce vs reduce/reduce | 대개 괜찮다 / 거의 항상 버그 |
| 정규 표현 vs 정규식(regex) | 형식 이론 / 역참조 등 확장 포함 |
