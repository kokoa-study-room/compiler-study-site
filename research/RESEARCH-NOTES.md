# 리서치 노트 — 컴파일러 최신 경향 (2024–2026)

> 이 파일은 사이트 문서(특히 "최신 경향과 연구 동향" 파트)를 작성하기 위해 수집한
> 1차 자료 모음입니다. 문서 본문에 반영된 주장은 모두 여기 출처를 근거로 합니다.
>
> 조사일: 2026-08-07

---

## 1. 파싱 이론 — PEG / 점진적 파싱 / 오류 복구

### 1.1 PEG 기반 런타임 확장 가능 파서 (DuckDB)
- DuckDB가 SQL 파서를 PEG 기반으로 재작성. 런타임에 문법을 확장할 수 있어
  확장(extension)이 새로운 SQL 구문을 동적으로 추가 가능.
- CIDR 2025 (Conference on Innovative Data Systems Research) 발표 채택.
- 출처: https://duckdb.org/2024/11/22/runtime-extensible-parsers

### 1.2 Labeled Failures — PEG 오류 보고/복구
- PEG는 원래 오류 메시지가 나쁘기로 유명 (ordered choice 때문에 "어디서 틀렸는지"를
  잃어버림). Labeled failure는 PEG의 보수적 확장으로 실패 지점에 레이블을 붙이고,
  레이블마다 **복구 표현식(recovery expression)** 을 연결해 오류 복구를 수행.
- Medeiros & Mascarenhas, "Syntax error recovery in parsing expression grammars",
  ACM SAC 2018. https://dl.acm.org/doi/10.1145/3167132.3167261
- 후속: "Error recovery in PEGs through labeled failures and its implementation
  based on a parsing machine", Journal of Computer Languages.
  https://www.sciencedirect.com/science/article/abs/pii/S1045926X18301897

### 1.3 Fast Incremental PEG Parsing (gpeg)
- Zachary Yedidia & Stephen Chong, SLE 2021.
- Incremental Packrat Parsing의 memoization 테이블을 **interval tree** 로 구현하고
  구간 이동(shift)을 지원 → 일반적인 편집에 대해 입력 크기의 **로그 시간** 재파싱.
  (기존 Incremental Packrat Parsing은 선형 시간)
- 다양한 입력 크기/문법에서 5ms 미만 재파싱 성능 보고.
- 논문: https://people.seas.harvard.edu/~chong/pubs/gpeg_sle21.pdf
- ACM DL: https://dl.acm.org/doi/10.1145/3486608.3486900
- 학위논문: https://zyedidia.github.io/notes/yedidia_thesis.pdf

### 1.4 Tree-sitter — GLR 기반 점진적 파싱
- 문법은 JavaScript DSL로 작성, 생성기는 Rust, 생성 결과는 C 또는 WebAssembly.
- **GLR(Generalized LR)** 전략 사용 → 실제 프로그래밍 언어의 모호성을 그래프 구조
  스택으로 동시에 탐색해 처리.
- 편집이 들어오면 기존 트리에 편집을 적용하고, 변경되지 않은 서브트리는 **재사용**,
  변경된 영역만 국소적으로 재파싱.
- GLR 덕분에 **오류 복구**도 자연스럽게 지원 — 입력이 문법적으로 깨져 있어도
  ERROR 노드를 올바른 위치에 넣은 유효한 구문 트리를 생성 (에디터에서 타이핑 중인
  코드에 필수).
- VS Code, Emacs, Neovim, GitHub 코드 탐색 등에 채택.
- 출처: https://tree-sitter.github.io/tree-sitter/
  https://tomassetti.me/incremental-parsing-using-tree-sitter/

### 1.5 ALL(*) — ANTLR 4의 적응형 LL 파싱
- Terence Parr, Sam Harwell, Kathleen Fisher, "Adaptive LL(*) Parsing: The Power of
  Dynamic Analysis", OOPSLA 2014.
- 핵심: 문법 분석을 **정적 생성 시점이 아니라 런타임으로 미룸**. 파서는 JIT처럼
  "예열"되며 실행할수록 빨라짐 (예측 결과를 DFA로 캐시).
- 이론적으로 O(n⁴)이지만 실무 문법에서는 일관되게 **선형**으로 동작.
  GLL/GLR보다 수 자릿수 빠름. Java 컴파일러의 손으로 쓴 파서보다 약 20% 느린 수준.
- LALR(bison)은 상향식 + 테이블 구동, ALL(*)은 하향식 + 제어 흐름에 인코딩 →
  생성 코드 가독성/디버깅이 유리.
- 논문: https://www.antlr.org/papers/allstar-techreport.pdf
- ACM DL: https://dl.acm.org/doi/10.1145/2714064.2660202

---

## 2. 어휘 분석기 생성기의 현대적 대안

### 2.1 RE/flex
- Flex++의 상위 호환. Unicode 패턴, indent/nodent/dedent 앵커, lazy quantifier,
  word boundary 등 현대적 정규식 기능 지원. Bison과 그대로 연동.
- Flex보다 빠르며 Boost.Regex, C++11 std::regex, PCRE2, RE2보다 훨씬 빠르다고 주장.
- 최근 릴리스: 6.0.0 (2025-06-19) — `Matcher::find()` 예측 매칭(PM3+PM5) 개선 및
  FSM 코드 생성 갱신 / 5.5.0 (2025-05-16) — hot path에 likely/unlikely 분기 표시 /
  6.1.0 (2026-03-06).
- 출처: https://github.com/Genivia/RE-flex , https://www.genivia.com/reflex.html

### 2.2 re2c
- 테이블 대신 **직접 코드 생성(direct-coded DFA)** 방식. submatch 추출 지원(TDFA).
- 벤치마크에서 비교 대상은 ragel과 re2c (flex는 submatch 미지원으로 제외).
- 출처: https://re2c.org/benchmarks/benchmarks.html

> 교안 관점 정리: flex/bison은 여전히 **이론(DFA/LR)을 그대로 드러내는 최고의 교육
> 도구**. 실무 최적화가 필요할 때 re2c/RE-flex, 에디터 도구가 필요할 때 tree-sitter,
> 문법 실험/다중 타깃이 필요할 때 ANTLR로 옮겨가는 지도를 제공한다.

---

## 3. 컴파일러 인프라 — MLIR

- MLIR: Google이 2019년 오픈소스로 공개, 현재 LLVM 프로젝트의 일부.
  **dialect(방언)** 시스템으로 여러 추상화 수준의 IR을 한 프레임워크에 담고,
  dialect 간 표준 변환을 통해 프론트엔드가 고수준 dialect로 번역한 뒤
  기존 MLIR 패스로 점진적으로 LLVM IR까지 **lowering** 하게 함.
- "The MLIR Transform Dialect: Your Compiler Is More Powerful Than You Think",
  CGO 2025 (ACM/IEEE Int'l Symposium on Code Generation and Optimization, 2025-03).
- Qualcomm: MLIR 기반 Hexagon NPU AI 컴파일러. Triton 커널(flash attention, softmax,
  argmax, matmul) 매핑에 성공, 손으로 쓴 커널 성능의 최대 80% 달성.
  https://llvm.org/devmtg/2025-10/slides/quick_talks/baskaran_slama.pdf
- 확장 사례: WebAssembly 컴파일(WAMI, arXiv:2506.16048), RISC-V 벡터 코드 생성
  (xDSL lowering), Fortran intrinsic의 AMD AI Engine 가속(arXiv:2502.10254),
  양자 컴퓨팅용 SSA IR(QSSA).
- 출처: https://mlir.llvm.org/pubs/

---

## 4. WebAssembly 런타임의 다단계 컴파일

- **Cranelift**: 타깃 독립 IR → 기계어. 최적화 패스는 2023년부터 기본 활성화.
- **Winch** (WebAssembly Intentionally-Non-Optimizing Compiler): 2022년 시작된
  baseline 컴파일러. Cranelift의 assembler 레이어를 재사용하되 Wasm → 기계어를
  **단일 패스**로 직역.
- 트레이드오프 수치: baseline 컴파일러는 평균 **15~20배 빠른 컴파일**, 생성 코드는
  평균 **1.1~1.5배 느림**.
- 주의: 현재 Wasmtime은 Winch로 시작해 Cranelift로 자동 전환하는 의미의 tiering은
  **아직 지원하지 않음**. 모듈 단위로 둘 중 하나를 선택.
- 출처: https://github.com/bytecodealliance/rfcs/blob/main/accepted/wasmtime-baseline-compilation.md
  https://github.com/bytecodealliance/wasmtime/tree/main/cranelift

---

## 5. 검증된 컴파일러 — CompCert

- 기계 검증(Coq)된 유일한 프로덕션 C 컴파일러. 생성된 어셈블리가 소스 C 프로그램의
  의미론대로 동작함을 형식적으로 보장 (miscompilation 부재).
- 타깃: ARM, PowerPC, RISC-V, x86.
- 규모: 약 42,000 줄의 Coq 코드, 약 3 person-year.
- 2025: Cornell 연구진이 `clightgen`으로 Bitcoin이 쓰는 libsecp256k1의
  modular-inverse 구현(safegcd) 정확성을 형식 검증. arXiv:2507.17956
- 확장 사례: 루프 최적화, peephole 최적화 등 검증된 최적화 추가.
  CompCert 백엔드를 형식 검증된 JIT로 전환하는 연구 (arXiv:2212.03129).
- Leroy, "Formal Verification of a Realistic Compiler", CACM.
  https://cacm.acm.org/research/formal-verification-of-a-realistic-compiler/
- 출처: https://www.absint.com/compcert/index.htm , https://github.com/AbsInt/CompCert

---

## 6. LLM과 컴파일러

- **LLM Compiler: Foundation Language Models for Compiler Optimization**,
  CC 2025 (34th ACM SIGPLAN Int'l Conference on Compiler Construction, 2025-03).
  Code Llama를 어셈블리 + 컴파일러 IR 대규모 코퍼스로 추가 사전학습한 뒤,
  컴파일러 에뮬레이션 데이터셋으로 instruction fine-tuning.
  https://dl.acm.org/doi/10.1145/3708493.3712691
- **ComPile**: 프로덕션 소스에서 수집한 대규모 LLVM IR 데이터셋. arXiv:2309.15432
- **Language Models for Code Optimization: Survey, Challenges and Future
  Directions**. arXiv:2501.01277
- 최근 연구 방향(2025–2026): Compiler-R1(RL 기반 컴파일러 auto-tuning),
  Magellan(AlphaEvolve로 새로운 최적화 휴리스틱 자동 발견, arXiv:2601.21096),
  PassNet(그래프 컴파일러 패스 생성, arXiv:2605.29357),
  CoLo(LLM 생성 IR의 오류 위치 정밀 교정, ICS 2026),
  멀티에이전트 기반 컴파일러 백엔드 자동 생성(2026).

> 교안 관점 정리: LLM은 **최적화 휴리스틱 탐색/자동 튜닝**에서 성과를 내고 있으나,
> 어휘·구문 분석 같은 **결정론적 정확성이 요구되는 프론트엔드**는 여전히
> 형식 문법 + 생성기가 지배적. 두 영역을 구분해서 가르쳐야 함.

---

## 참고 링크 정리 (문서 각주용)

| 주제 | 링크 |
|---|---|
| DuckDB PEG 파서 | https://duckdb.org/2024/11/22/runtime-extensible-parsers |
| Fast Incremental PEG Parsing (SLE'21) | https://people.seas.harvard.edu/~chong/pubs/gpeg_sle21.pdf |
| PEG 오류 복구 (SAC'18) | https://dl.acm.org/doi/10.1145/3167132.3167261 |
| Tree-sitter | https://tree-sitter.github.io/tree-sitter/ |
| ALL(*) 논문 | https://www.antlr.org/papers/allstar-techreport.pdf |
| RE/flex | https://github.com/Genivia/RE-flex |
| re2c 벤치마크 | https://re2c.org/benchmarks/benchmarks.html |
| MLIR 논문 목록 | https://mlir.llvm.org/pubs/ |
| Qualcomm MLIR/Hexagon | https://llvm.org/devmtg/2025-10/slides/quick_talks/baskaran_slama.pdf |
| Wasmtime baseline RFC | https://github.com/bytecodealliance/rfcs/blob/main/accepted/wasmtime-baseline-compilation.md |
| CompCert | https://www.absint.com/compcert/index.htm |
| Leroy, CACM | https://cacm.acm.org/research/formal-verification-of-a-realistic-compiler/ |
| LLM Compiler (CC'25) | https://dl.acm.org/doi/10.1145/3708493.3712691 |
| Code Optimization LM Survey | https://arxiv.org/pdf/2501.01277 |
