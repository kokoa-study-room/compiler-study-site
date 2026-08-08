---
id: bibliography
title: 참고 문헌
sidebar_label: 참고 문헌
sidebar_position: 3
description: 교안이 근거로 삼은 교재, 원논문, 매뉴얼. 장별로 어디를 보면 되는지 정리했다.
---

# 참고 문헌

교안이 근거로 삼은 자료를 모았다.
**"이 장을 더 파고 싶으면 무엇을 읽어야 하나"** 를 기준으로 정리했다.

원논문을 굳이 함께 적은 이유가 있다.
교과서는 정리된 결론만 보여 주지만,
원논문에는 **그 사람이 무슨 문제를 풀려고 했는지**가 남아 있다.
LR 파싱이 왜 그렇게 복잡한 모양인지는
Knuth가 1965년에 무엇을 증명하려 했는지를 보면 훨씬 잘 이해된다.

:::note[논문을 꼭 읽어야 하나]
아니다. **교재만으로 충분하다.**

이 목록은 나중에 "그 이야기 어디서 나온 거지?" 싶을 때
돌아오라고 있는 것이다. 지금 다 열어 볼 필요는 없다.
:::

---

## 교재

| 약칭 | 서지 | 이 교안에서의 위치 |
|---|---|---|
| **용책 (Dragon Book)** | Aho, Lam, Sethi, Ullman, *Compilers: Principles, Techniques, and Tools*, 2nd ed., Addison-Wesley, 2006 | 전체의 뼈대. 특히 3장(어휘 분석) → 이 교안 2~3부, 4장(구문 분석) → 4~5부, 5장(SDT) → [17장](/docs/parsing/syntax-directed-translation) |
| **HMU** | Hopcroft, Motwani, Ullman, *Introduction to Automata Theory, Languages, and Computation*, 3rd ed., 2006 | 오토마타의 형식적 정의와 증명. [3](/docs/regular/regular-languages)~[6장](/docs/regular/representations), [10](/docs/parsing/context-free-grammar)~[11장](/docs/parsing/grammar-hierarchy) |
| **flex & bison** | John Levine, *flex & bison*, O'Reilly, 2009 | 도구의 실무적 세부. [7](/docs/lex/lex-overview)~[9장](/docs/lex/writing-lex-files), [18](/docs/yacc/yacc-overview)~[20장](/docs/yacc/conflicts-and-precedence) |
| **Appel** | Andrew Appel, *Modern Compiler Implementation in C/ML/Java*, Cambridge, 1998 | 프론트엔드 이후(중간 코드·최적화·백엔드)로 넘어갈 때 |
| **Cooper & Torczon** | Cooper, Torczon, *Engineering a Compiler*, 3rd ed., 2022 | 용책보다 구현 쪽으로 기운 대안 교재 |

:::tip[한 권만 고른다면]
**용책 4장**이다. 이 교안 4~5부는 사실상 그 장을 따라 걷는다.
$I_0 \sim I_{11}$ 같은 항목 집합 번호도 용책과 맞춰 두었으므로
나란히 놓고 읽을 수 있다.
:::

---

## 원논문 — 이론

| 개념 | 논문 | 관련 장 |
|---|---|---|
| **정규 표현 → NFA** | Ken Thompson, "Regular Expression Search Algorithm", *CACM* 11(6), 1968 | [6.2](/docs/regular/representations#62-정규-표현--nfa-thompson-구성) |
| **정규 사건의 표현** | S. C. Kleene, "Representation of Events in Nerve Nets and Finite Automata", 1956 | [3장](/docs/regular/regular-languages) — 클레이니 클로저의 출처 |
| **최소 DFA의 유일성** | Anil Nerode, "Linear Automaton Transformations", 1958 / John Myhill, 1957 | [6.4](/docs/regular/representations#64-dfa-최소화) |
| **DFA 최소화 $O(n \log n)$** | John Hopcroft, "An $n\log n$ Algorithm for Minimizing States in a Finite Automaton", 1971 | [6.4 복잡도](/docs/regular/representations#복잡도) |
| **문법의 계층** | Noam Chomsky, "Three Models for the Description of Language", *IRE Trans. Information Theory*, 1956 | [11장](/docs/parsing/grammar-hierarchy) |
| **CFG의 펌핑 보조정리** | Bar-Hillel, Perles, Shamir, "On Formal Properties of Simple Phrase Structure Grammars", 1961 | [10.4](/docs/parsing/context-free-grammar#104-cfg의-펌핑-보조정리) |

---

## 원논문 — 파싱

| 개념 | 논문 | 관련 장 |
|---|---|---|
| **LR 파싱** | Donald E. Knuth, "On the Translation of Languages from Left to Right", *Information and Control* 8(6), 1965 | [15장](/docs/parsing/lr-parsing) — LR(1)의 원전. "상태가 너무 많다"는 문제도 여기서 함께 지적된다 |
| **LALR(1)** | Frank DeRemer, *Practical Translators for LR(k) Languages*, MIT 박사논문, 1969 | [15.7](/docs/parsing/lr-parsing#157-lr1과-lalr1) — 코어 병합 아이디어 |
| **LALR lookahead 계산** | DeRemer, Pennello, "Efficient Computation of LALR(1) Look-Ahead Sets", *TOPLAS* 4(4), 1982 | bison이 실제로 쓰는 알고리즘 |
| **일반 CFG 파싱** | Jay Earley, "An Efficient Context-Free Parsing Algorithm", *CACM* 13(2), 1970 | [10.3 결정적 PDA](/docs/parsing/context-free-grammar#결정적-pda) — 일반 CFL의 $O(n^3)$ |
| **GLR** | Masaru Tomita, *Efficient Parsing for Natural Language*, Kluwer, 1985 | [16.8](/docs/parsing/lr-parser-implementation#168-glr--충돌을-포기하지-않기) |
| **연산자 우선순위 / Pratt 파싱** | Vaughan Pratt, "Top Down Operator Precedence", *POPL*, 1973 | [14장](/docs/parsing/operator-precedence) |
| **PEG** | Bryan Ford, "Parsing Expression Grammars: A Recognition-Based Syntactic Foundation", *POPL*, 2004 | [13.6](/docs/parsing/ll-parsing#136-llk와-그-너머), [21.2](/docs/modern/trends#212-peg--순서-있는-선택) |
| **ALL(\*)** | Parr, Harding, Fisher, "Adaptive LL(\*) Parsing: The Power of Dynamic Analysis", *OOPSLA*, 2014 | [22장 ANTLR](/docs/modern/toolchain-map#antlr-4) |
| **속성 문법** | Donald E. Knuth, "Semantics of Context-Free Languages", *Mathematical Systems Theory* 2(2), 1968 | [17장](/docs/parsing/syntax-directed-translation) — 합성/상속 속성의 원전 |

:::info[Knuth가 두 번 나오는 이유]
1965년에 **어떻게 파싱할 것인가**(LR)를 정리하고,
1968년에 **파싱하면서 무엇을 계산할 것인가**(속성 문법)를 정리했다.

이 교안의 15장과 17장이 정확히 그 두 편에 대응한다.
:::

---

## 도구 매뉴얼

실제 동작이 궁금할 때는 항상 매뉴얼이 최종 근거다.
이 교안에 실린 도구 출력은 전부 아래 버전으로 직접 실행한 결과다.

| 도구 | 문서 | 이 교안에서 쓴 버전 |
|---|---|---|
| flex | [flex 매뉴얼](https://westes.github.io/flex/manual/) | 2.6.4 |
| GNU Bison | [Bison 매뉴얼](https://www.gnu.org/software/bison/manual/) | 2.3 (Apple), 3.x 확인 병행 |
| POSIX lex/yacc | [POSIX.1-2017 `lex`](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/lex.html) · [`yacc`](https://pubs.opengroup.org/onlinepubs/9699919799/utilities/yacc.html) | 이식성 기준 |

```bash
flex --version      # flex 2.6.4
bison --version     # bison (GNU Bison) 2.3
```

:::caution[버전 차이가 결과를 바꾼다]
macOS의 `bison` 은 2003년에 나온 **2.3**이다.
`%define`, `-Wall`, `--report=all`, canonical LR 옵션 등이 없다.

3.x가 필요하면 `brew install bison` 후
`/opt/homebrew/opt/bison/bin` 을 `PATH` 앞에 둔다.
자세한 것은 [실습 환경 구성](/docs/labs/setup)에 있다.
:::

---

## 현대 동향

[21장](/docs/modern/trends)과 [22장](/docs/modern/toolchain-map)의 근거 자료다.
전체 목록과 조사 메모는 저장소의 `research/RESEARCH-NOTES.md` 에 있다.

| 주제 | 자료 |
|---|---|
| 점진적 파싱 | [tree-sitter 문서](https://tree-sitter.github.io/tree-sitter/) |
| 점진적 PEG | Yedidia, Chong, ["Fast Incremental PEG Parsing"](https://people.seas.harvard.edu/~chong/pubs/gpeg_sle21.pdf), SLE 2021 |
| PEG 오류 복구 | Medeiros, Mascarenhas, ["Syntax Error Recovery in Parsing Expression Grammars"](https://dl.acm.org/doi/10.1145/3167132.3167261), SAC 2018 |
| 실행 시점 확장 파서 | [DuckDB, "Runtime-Extensible Parsers"](https://duckdb.org/2024/11/22/runtime-extensible-parsers), 2024 |
| 스캐너 생성기 성능 | [re2c 벤치마크](https://re2c.org/benchmarks/benchmarks.html) |
| 유니코드 스캐너 | [RE/flex](https://github.com/Genivia/RE-flex) |
| 다층 IR | [MLIR 논문 목록](https://mlir.llvm.org/pubs/) |
| 검증된 컴파일러 | Xavier Leroy, ["Formal Verification of a Realistic Compiler"](https://cacm.acm.org/research/formal-verification-of-a-realistic-compiler/), *CACM* 52(7), 2009 · [CompCert](https://www.absint.com/compcert/index.htm) |

---

## 찾아보기 좋은 곳

- **ACM Digital Library** — 위 논문 대부분이 여기 있다. 대학 계정으로 접근할 수 있는 경우가 많다.
- **저자 홈페이지** — Knuth, Parr, Ford 등은 논문 PDF를 직접 공개해 두었다.
- **`bison --help`, `man flex`** — 옵션 하나가 궁금할 때는 이쪽이 제일 빠르다.
