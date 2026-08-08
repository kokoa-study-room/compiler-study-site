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
| 무제한 문법 | unrestricted grammar | 유형 0 — 규칙에 제약이 없다 | [11](/docs/parsing/grammar-hierarchy#유형-0--무제한-문법-unrestricted-grammar) |
| 재귀 열거 언어 | recursively enumerable language | 유형 0이 만드는 언어. 소속 판정이 **결정 불가능** | [11](/docs/parsing/grammar-hierarchy#유형-0--무제한-문법-unrestricted-grammar) |
| 튜링 기계 | Turing machine | 유형 0에 대응하는 기계 | [11](/docs/parsing/grammar-hierarchy#유형-0--무제한-문법-unrestricted-grammar) |
| 문맥 의존 문법 | context-sensitive grammar | 유형 1 — 규칙이 길이를 줄이지 않는다 | [11](/docs/parsing/grammar-hierarchy#유형-1--문맥-의존-문법-context-sensitive-grammar) |
| 선형 유계 오토마타 | linear-bounded automaton (LBA) | 유형 1에 대응하는 기계 — 테이프가 입력 길이로 제한된 튜링 기계 | [11](/docs/parsing/grammar-hierarchy#유형-1--문맥-의존-문법-context-sensitive-grammar) |
| 본질적 모호성 | inherent ambiguity | 어떤 문법으로도 모호성을 없앨 수 없는 언어의 성질 | [2](/docs/foundations/language-and-grammar#본질적-모호성) |
| 소속 판정 문제 | membership problem | "이 스트링이 이 언어의 원소인가"를 묻는 문제. 파싱이 곧 이 문제를 푸는 일이다 | [2](/docs/foundations/language-and-grammar#언어) |
| 멱집합 | power set | $2^A$ — $A$ 의 부분집합 전부를 모은 집합. NFA 전이 함수의 공역 | [5](/docs/regular/finite-automata#52-비결정적-유한-오토마타-nfa) |

---

## 정규언어와 오토마타

| 한국어 | 영어 | 뜻 | 장 |
|---|---|---|---|
| 정규언어 | regular language | 정규 표현으로 표현되는 언어 | [3](/docs/regular/regular-languages) |
| 정규 문법 | regular grammar | 우선형/좌선형 문법 (유형 3) | [3](/docs/regular/regular-languages#32-정규-문법) |
| 우선형 문법 | right-linear grammar | $A \to aB$ 또는 $A \to a$ — 넌터미널이 맨 오른쪽 | [3](/docs/regular/regular-languages#우선형-문법과-오토마타의-대응) |
| 좌선형 문법 | left-linear grammar | $A \to Ba$ 또는 $A \to a$ — 넌터미널이 맨 왼쪽 | [3](/docs/regular/regular-languages#좌선형-문법의-예) |
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
| 전함수 | total function | 모든 (상태, 입력) 짝에 값이 정의된 $\delta$. 이런 DFA를 **완전하다**고 한다 | [5](/docs/regular/finite-automata#완전성과-죽은-상태) |
| 상태 폭발 | state explosion | NFA 상태 $n$ 개가 DFA 상태 최대 $2^n$ 개가 되는 현상 | [5](/docs/regular/finite-automata#55-오토마타의-상태-폭발) |
| Thompson 구성 | Thompson's construction | 정규 표현 → ε-NFA | [6](/docs/regular/representations#62-정규-표현--nfa-thompson-구성) |
| 부분집합 구성 | subset construction | NFA → DFA | [6](/docs/regular/representations#63-nfa--dfa-부분집합-구성) |
| 분할 정제 | partition refinement | DFA 최소화 알고리즘 | [6](/docs/regular/representations#64-dfa-최소화) |
| Myhill–Nerode 정리 | Myhill–Nerode theorem | 최소 DFA의 유일성 | [6](/docs/regular/representations#myhillnerode-관계) |
| 구별 불가능 | indistinguishable | 어떤 접미사를 붙여도 수락 여부가 갈리지 않는 두 상태 | [6](/docs/regular/representations#myhillnerode-관계) |
| 상태 소거 | state elimination | DFA → 정규 표현 | [6](/docs/regular/representations#65-dfa--정규-표현-상태-소거법) |
| followpos | followpos | 정규 표현에서 DFA 직행 | [6](/docs/regular/representations#67-정규-표현--dfa-직행-followpos) |

---

## 컴파일러의 구조

| 한국어 | 영어 | 뜻 | 장 |
|---|---|---|---|
| 인터프리터 | interpreter | 번역 결과를 남기지 않고 **읽으면서 바로 실행**하는 방식 | [1](/docs/foundations/compiler-overview#인터프리터와의-차이) |
| 단계 | phase | 컴파일러의 **논리적** 구분 (어휘 분석, 구문 분석 …) | [1](/docs/foundations/compiler-overview#패스pass와-단계phase) |
| 패스 | pass | 입력을 처음부터 끝까지 **실제로 훑는 횟수** | [1](/docs/foundations/compiler-overview#패스pass와-단계phase) |
| 부트스트랩 | bootstrapping | 컴파일러를 자기 자신으로 컴파일할 수 있게 되기까지의 과정 | [1](/docs/foundations/compiler-overview#15-컴파일러는-무엇으로-만드나--부트스트랩) |
| 셀프 호스팅 | self-hosting | 그 언어로 쓰인 컴파일러가 그 언어를 컴파일하는 상태 | [1](/docs/foundations/compiler-overview#크로스-컴파일--그-기계에서-돌릴-수-없을-때) |
| 재현 가능한 빌드 | reproducible build | 같은 소스에서 항상 같은 바이너리가 나오게 하는 것 | [1](/docs/foundations/compiler-overview#크로스-컴파일--그-기계에서-돌릴-수-없을-때) |
| 크로스 컴파일러 | cross compiler | 지금 도는 기계와 **다른 기계**의 코드를 뱉는 컴파일러 | [1](/docs/foundations/compiler-overview#11-컴파일러란-무엇인가) |

---

## 어휘 분석

| 한국어 | 영어 | 뜻 | 장 |
|---|---|---|---|
| 어휘 분석 | lexical analysis | 문자 → 토큰 | [1](/docs/foundations/compiler-overview#-어휘-분석-lexical-analysis) |
| 스캐너 | scanner (= tokenizer, 토크나이저) | 어휘 분석을 수행하는 프로그램 | [1](/docs/foundations/compiler-overview#-어휘-분석-lexical-analysis) |
| 토큰 | token | 의미 있는 최소 단위 | [1](/docs/foundations/compiler-overview#-어휘-분석-lexical-analysis) |
| 렉심 | lexeme | 토큰에 대응하는 실제 문자열 | [7](/docs/lex/lex-overview) |
| 최장 일치 | longest match / maximal munch | 가장 긴 매치를 택한다 | [8](/docs/lex/lex-input-and-parsing#최장-일치) |
| 규칙 우선순위 | rule priority | 길이가 같으면 먼저 쓴 규칙 | [8](/docs/lex/lex-input-and-parsing#규칙-우선순위) |
| 되감기 | backtracking | 마지막 수락 지점으로 되돌아가기 | [8](/docs/lex/lex-input-and-parsing#되감기backtracking) |
| 이중 버퍼 | double buffering | 버퍼를 반씩 번갈아 채워 토큰이 잘리지 않게 하는 기법 | [8](/docs/lex/lex-input-and-parsing#이중-버퍼-two-buffer-scheme) |
| 보초 | sentinel | 버퍼 끝에 두는 표식 문자 — 경계 검사를 한 번으로 줄인다 | [8](/docs/lex/lex-input-and-parsing#보초-기법-sentinel) |
| 시작 조건 | start condition | 스캐너의 모드 (`%x`) | [9](/docs/lex/writing-lex-files#92-시작-조건) |
| 기본 규칙 | default rule | 매치 안 되면 그대로 출력 | [7](/docs/lex/lex-overview#72-lex-입력-파일의-구조) |
| 정의부 | definition section | lex 입력 파일의 첫 부분. `%option`, C 블록, 정규 정의가 들어간다 | [7](/docs/lex/lex-overview#72-lex-입력-파일의-구조) |
| 동등 클래스 | equivalence class | 전이가 같은 문자들을 한 열로 묶어 표를 줄이는 flex 기법 | [9](/docs/lex/writing-lex-files#99-성능-관련-옵션) |

---

## 구문 분석

| 한국어 | 영어 | 뜻 | 장 |
|---|---|---|---|
| 구문 분석 | syntax analysis / parsing | 토큰 → 구조 | [12](/docs/parsing/syntax-analysis) |
| 문맥 자유 문법 | context-free grammar (CFG) | 좌변이 넌터미널 하나 (유형 2) | [10](/docs/parsing/context-free-grammar) |
| 푸시다운 오토마타 | pushdown automaton (PDA) | 유한 오토마타 + 스택 | [10](/docs/parsing/context-free-grammar#103-푸시다운-오토마타) |
| DCFL | deterministic context-free language | 결정적 PDA가 인식하는 언어 부류. **LR(1) 문법이 인식하는 언어와 정확히 같다** | [10](/docs/parsing/context-free-grammar#결정적-pda) |
| 좌재귀 | left recursion | $A \to A\alpha$ | [10](/docs/parsing/context-free-grammar#좌재귀-제거) |
| 좌인수분해 | left factoring | 공통 접두사 뽑아내기 | [10](/docs/parsing/context-free-grammar#좌인수분해) |
| 쓸모없는 심볼 | useless symbol | 도달할 수 없거나(unreachable) 터미널 열을 못 만드는(non-generating) 심볼 | [10](/docs/parsing/context-free-grammar#쓸모없는-심볼-제거) |
| 비생성적 | non-productive | 어떤 터미널 열도 만들어 내지 못하는 넌터미널 | [10](/docs/parsing/context-free-grammar#쓸모없는-심볼-제거) |
| Chomsky 표준형 | Chomsky normal form (CNF) | 모든 규칙이 $A \to BC$ 또는 $A \to a$ — CYK 알고리즘의 전제 | [10](/docs/parsing/context-free-grammar#정규형-참고) |
| Greibach 표준형 | Greibach normal form (GNF) | 모든 규칙이 $A \to a\alpha$ — 좌재귀가 원천적으로 없다 | [10](/docs/parsing/context-free-grammar#정규형-참고) |
| 하향식 | top-down | 시작 심볼에서 아래로 전개해 내려간다 (LL) | [12](/docs/parsing/syntax-analysis#121-두-가지-전략) |
| 상향식 | bottom-up | 토큰에서 위로 축약해 올라간다 (LR) | [12](/docs/parsing/syntax-analysis#121-두-가지-전략) |
| 추상 구문 트리 | AST, abstract syntax tree | 의미에 필요한 것만 남긴 트리 | [12](/docs/parsing/syntax-analysis#파스-트리-vs-ast) |
| CST | concrete syntax tree | 문법의 모든 세부를 담은 트리 | [12](/docs/parsing/syntax-analysis#파스-트리-vs-ast) |
| FIRST | FIRST set | 첫 터미널이 될 수 있는 것들 | [12](/docs/parsing/syntax-analysis#123-first-집합) |
| FOLLOW | FOLLOW set | 바로 뒤에 올 수 있는 터미널들 | [12](/docs/parsing/syntax-analysis#124-follow-집합) |
| 고정점 계산 | fixed-point computation | 변화가 없을 때까지 반복 | [12](/docs/parsing/syntax-analysis#123-first-집합) |
| 재귀 하강 | recursive descent | 넌터미널마다 함수 | [13](/docs/parsing/ll-parsing#131-재귀-하강-파싱) |
| 예측 파싱 | predictive parsing | 표 구동 LL | [13](/docs/parsing/ll-parsing#132-표-구동-예측-파싱) |
| LL(1) | LL(1) | **L**eft-to-right 스캔 · **L**eftmost 유도 · lookahead **1** 개 | [13](/docs/parsing/ll-parsing#135-ll1-조건) |
| PEG | parsing expression grammar | 순서 있는 선택을 쓰는 문법 형식 — 모호성이 원천적으로 없다 | [13](/docs/parsing/ll-parsing#백트래킹과-peg) |
| 순서 있는 선택 | ordered choice | PEG의 `/` — 먼저 성공한 대안을 택하고 나머지는 보지 않는다 | [21](/docs/modern/trends#212-peg--순서-있는-선택) |
| 연산자 문법 | operator grammar | 우변에 넌터미널이 인접하지 않고 $\varepsilon$ 규칙도 없는 문법 | [14](/docs/parsing/operator-precedence#141-연산자-문법) |
| 우선 관계 | precedence relation | $\lessdot\ \doteq\ \gtrdot$ — 터미널 쌍 사이의 "누가 먼저 묶이나" | [14](/docs/parsing/operator-precedence#142-우선-관계) |
| 연산자 우선순위 파싱 | operator-precedence parsing | 우선 관계로 핸들을 찾는 상향식 파싱 | [14](/docs/parsing/operator-precedence) |
| 우선 함수 | precedence function | 우선 관계를 두 정수 함수 $f, g$ 로 압축한 것 | [14](/docs/parsing/operator-precedence#144-우선-함수) |
| 이동 | shift | 토큰을 스택에 밀어 넣기 | [15](/docs/parsing/lr-parsing#151-이동-축약-파싱) |
| 축약 | reduce | 우변을 좌변으로 바꾸기 | [15](/docs/parsing/lr-parsing#151-이동-축약-파싱) |
| 핸들 | handle | 지금 축약해야 할 부분 | [15](/docs/parsing/lr-parsing#핸들) |
| LR(0) 항목 | LR(0) item | 우변에 점을 찍은 것 | [15](/docs/parsing/lr-parsing#152-lr0-항목) |
| 완결 항목 | complete item | 점이 맨 끝에 있는 항목 $A \to \alpha\cdot$ — 축약할 수 있다는 뜻 | [15](/docs/parsing/lr-parsing#152-lr0-항목) |
| LR(1) 항목 | LR(1) item | 항목에 lookahead 를 붙인 것 $[A \to \alpha\cdot\beta,\ a]$ | [15](/docs/parsing/lr-parsing#lr1-항목) |
| 코어 | core | 항목 집합에서 lookahead 를 떼어 낸 LR(0) 부분 | [15](/docs/parsing/lr-parsing#lalr1) |
| SLR(1) | simple LR | 축약 lookahead 로 $\mathrm{FOLLOW}(A)$ 를 쓰는 LR — 가장 단순하고 가장 약하다 | [15](/docs/parsing/lr-parsing#154-slr1-표-만들기) |
| LALR(1) | look-ahead LR | 코어가 같은 LR(1) 상태를 병합 — 표는 LR(0) 크기, 정확도는 그 이상. **yacc/bison의 기본** | [15](/docs/parsing/lr-parsing#lalr1) |
| 정준 항목 집합 | canonical collection | CLOSURE/GOTO 로 만든 상태 집합 | [15](/docs/parsing/lr-parsing#153-정준-lr0-항목-집합) |
| 실행 가능한 접두사 | viable prefix | 스택에 쌓일 수 있는 심볼 열 | [15](/docs/parsing/lr-parsing#153-정준-lr0-항목-집합) |
| 증강 문법 | augmented grammar | $S' \to S$ 를 추가한 문법 | [15](/docs/parsing/lr-parsing#증강-문법) |
| 충돌 | conflict | 표 한 칸에 액션이 둘 이상 | [15](/docs/parsing/lr-parsing#156-충돌) |
| dangling else | dangling else | `else` 가 어느 `if` 에 붙는가 | [20](/docs/yacc/conflicts-and-precedence#204-dangling-else) |
| GLR | generalized LR | 충돌 시 모든 가능성 탐색 | [16](/docs/parsing/lr-parser-implementation#168-glr--충돌을-포기하지-않기) |
| 기본 축약 | default reduction | 표 압축 기법 (`$default`) | [16](/docs/parsing/lr-parser-implementation#166-표-압축) |
| 패닉 모드 | panic mode | 동기화 토큰까지 버리는 오류 복구 | [12](/docs/parsing/syntax-analysis#126-구문-오류-처리) |
| 오류 생성 규칙 | error production | 흔한 오류를 아예 문법 규칙으로 넣어 진단을 내는 기법 | [12](/docs/parsing/syntax-analysis#오류-복구-전략) |
| 구문 수준 복구 | phrase-level recovery | 토큰을 삽입·삭제·교체해 국소적으로 고치는 복구 | [12](/docs/parsing/syntax-analysis#오류-복구-전략) |
| 복구 표현식 | recovery expression | PEG 에서 실패 지점마다 붙여 두는 대체 규칙. 오류 복구를 문법에 명시한다 | [21](/docs/modern/trends#peg의-약점과-최근-연구) |
| 연쇄 오류 | cascading errors | 오류 하나가 뒤따르는 가짜 오류를 줄줄이 만들어 내는 현상 | [12](/docs/parsing/syntax-analysis#126-구문-오류-처리) |

---

## 의미 분석과 코드 생성

| 한국어 | 영어 | 뜻 | 장 |
|---|---|---|---|
| 의미 분석 | semantic analysis | 타입·선언 검사 | [1](/docs/foundations/compiler-overview#-의미-분석-semantic-analysis) |
| 속성 | attribute | 문법 심볼에 붙인 값 ($X.a$ 로 적는다) | [17](/docs/parsing/syntax-directed-translation#171-속성) |
| 합성 속성 | synthesized attribute | 자식의 속성으로 부모를 정한다 (아래 → 위) | [17](/docs/parsing/syntax-directed-translation#172-두-종류의-속성) |
| 상속 속성 | inherited attribute | 부모·왼쪽 형제의 속성으로 자식을 정한다 (위 → 아래) | [17](/docs/parsing/syntax-directed-translation#172-두-종류의-속성) |
| 구문 지향 정의 | syntax-directed definition (SDD) | 규칙마다 의미 규칙을 붙인 문법. **무엇**을 계산할지만 말한다 | [17](/docs/parsing/syntax-directed-translation#173-sdd와-주석-달린-파스-트리) |
| 구문 지향 번역 | syntax-directed translation (SDT) | 의미 규칙을 실행 시점까지 정해 액션으로 심은 것. **언제**까지 말한다 | [17](/docs/parsing/syntax-directed-translation#176-sdd와-sdt) |
| 의미 규칙 | semantic rule | 속성값을 정하는 식 $A.a := f(\dots)$ | [17](/docs/parsing/syntax-directed-translation#173-sdd와-주석-달린-파스-트리) |
| 주석 달린 파스 트리 | annotated parse tree | 각 노드에 속성값을 적어 넣은 파스 트리 | [17](/docs/parsing/syntax-directed-translation#173-sdd와-주석-달린-파스-트리) |
| 의존 그래프 | dependency graph | 속성 사이의 계산 선후를 나타내는 방향 그래프. 위상 정렬이 계산 순서 | [17](/docs/parsing/syntax-directed-translation#174-의존-그래프) |
| 후위 순회 | postorder traversal | 자식을 모두 방문한 뒤 부모를 방문. **LR 파서의 액션 실행 순서**와 같다 | [시작](/docs/prerequisites#순회-순서--이건-꼭-알아야-한다) |
| 공용체 | union | C의 `union` — 한 자리에 여러 타입 중 하나를 담는다. yacc의 `%union` | [16](/docs/parsing/lr-parser-implementation#타입이-여럿일-때) |
| S-속성 문법 | S-attributed grammar | 합성 속성만 쓰는 SDD — **LR 파싱 중에 그대로 계산된다** | [17](/docs/parsing/syntax-directed-translation#s-속성-문법) |
| L-속성 문법 | L-attributed grammar | 왼쪽에서 오는 상속 속성까지 허용 — LL(재귀 하강)에 자연스럽다 | [17](/docs/parsing/syntax-directed-translation#l-속성-문법) |
| 중간 액션 | mid-rule action | 규칙 중간에 놓인 `{ … }` — 빈 넌터미널로 바뀌어 충돌을 만들 수 있다 | [18](/docs/yacc/yacc-overview#중간-액션) |
| 심볼 테이블 | symbol table | 이름 → 속성 매핑 | [19](/docs/yacc/yacc-grammar-and-actions#194-심볼-테이블) |
| 형 변환 | type coercion | 암묵적 타입 변환 | [19](/docs/yacc/yacc-grammar-and-actions#형-변환-노드-삽입) |
| 중간 표현 | intermediate representation (IR) | 기계 독립 표현 | [1](/docs/foundations/compiler-overview#-중간-코드-생성) |
| 3-주소 코드 | three-address code | 연산자 1개, 피연산자 최대 3개 | [1](/docs/foundations/compiler-overview#-중간-코드-생성) |
| 4중자 | quadruple | `(op, arg1, arg2, result)` — 결과에 이름이 있다 | [19](/docs/yacc/yacc-grammar-and-actions#4중자-quadruple) |
| 3중자 | triple | `(op, arg1, arg2)` — 결과는 자기 위치 번호로 가리킨다 | [19](/docs/yacc/yacc-grammar-and-actions#3중자-triple) |
| 간접 3중자 | indirect triple | 3중자 배열 + 실행 순서 포인터 목록. 재배치가 싸다 | [19](/docs/yacc/yacc-grammar-and-actions#간접-3중자-indirect-triple) |
| 점프 코드 | jump code | 부울식을 값이 아니라 제어 흐름으로 번역한 코드 | [19](/docs/yacc/yacc-grammar-and-actions#점프-코드) |
| SSA | static single assignment | 변수마다 대입이 한 번뿐인 IR. LLVM IR이 그렇다 | [22](/docs/modern/toolchain-map#226-이-교안-이후) |
| 상수 접기 | constant folding | 컴파일 시점 계산 | [1](/docs/foundations/compiler-overview#-코드-최적화) |
| 단축 평가 | short-circuit evaluation | `&&`, `||` 의 조기 종료 | [통합](/docs/labs/mini-compiler#5-확장-과제) |
| 백패칭 | backpatching | 점프 대상을 비워 두고 나중에 채우기 | [19](/docs/yacc/yacc-grammar-and-actions#198-백패칭--단축-평가와-점프-코드) |

---

## 도구

| 이름 | 정체 | 장 |
|---|---|---|
| lex / flex | 어휘 분석기 생성기 | [7](/docs/lex/lex-overview) |
| yacc / bison | LALR(1) 파서 생성기 | [18](/docs/yacc/yacc-overview) |
| re2c | 직접 코드 생성 스캐너 생성기 | [22](/docs/modern/toolchain-map#re2c) |
| RE-flex | 유니코드 지원 flex 대안 | [22](/docs/modern/toolchain-map#reflex) |
| ANTLR 4 | ALL(\*) 파서 생성기 | [22](/docs/modern/toolchain-map#antlr-4) |
| tree-sitter | 점진적 GLR 파서 (에디터용) | [21](/docs/modern/trends#tree-sitter--glr-기반-점진적-파싱) |
| Menhir | 검증된 LR(1) 파서 생성기 (OCaml) | [22](/docs/modern/toolchain-map#menhir-ocaml) |
| LLVM | 컴파일러 백엔드 인프라 | [22](/docs/modern/toolchain-map#llvm) |
| MLIR | 다층 dialect IR | [21](/docs/modern/trends#214-mlir--여러-층의-ir) |
| CompCert | 형식 검증된 C 컴파일러 | [21](/docs/modern/trends#216-검증된-컴파일러) |

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
| 스트링 vs 문자열 | 이론의 형식적 대상 / 프로그램 안의 실제 데이터 |
| 파스 트리 vs AST | 모든 세부 / 의미만 |
| shift/reduce vs reduce/reduce | 대개 괜찮다 / 거의 항상 버그 |
| 정규 표현 vs 정규식(regex) | 형식 이론 / 역참조 등 확장 포함 |
