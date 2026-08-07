# 진행 상황

컴파일러 교안 사이트 구축 기록. 작업 단위마다 이 파일을 갱신하고 커밋한다.

- 사람이 읽을 서술형 기록은 사이트의 [개발 로그](site/blog/)에도 남긴다.
- 최신 동향 조사의 1차 자료는 [`research/RESEARCH-NOTES.md`](research/RESEARCH-NOTES.md).

---

## 전체 계획

| # | 작업 | 상태 |
|---|---|---|
| 1 | 사이트 기반 설정 (Mermaid / KaTeX / 한국어 / 사이드바 / 홈) | ✅ 완료 |
| 2 | 최신 경향·연구 리서치 | ✅ 완료 |
| 3 | 1부 — 컴파일러 개요, 언어와 문법 | ✅ 완료 |
| 4 | 2부 — 정규언어, 정규 표현, 유한 오토마타, 표현 방법 | ✅ 완료 |
| 5 | 3부 — LEX 3개 장 + flex 실습 코드 | ✅ 완료 |
| 6 | 4부 — CFG, 문법 유형, 구문 분석, LL, LR, LR 구현 | ✅ 완료 |
| 7 | 5부 — YACC 3개 장 + bison 실습, 통합 미니 컴파일러 | ✅ 완료 |
| 8 | 6부 — 최신 경향과 연구, 도구 지형도 | ✅ 완료 |
| 9 | 실습 하네스 — examples/ 빌드·테스트 자동화 | ✅ 완료 (작업 5에서 구축, 이후 확장) |
| 10 | 최종 검증 — 링크 `throw` 복구, 전체 빌드, README 정리 | ✅ 완료 |

---

## 기록

### 2026-08-07 · 작업 1–3

**한 일**

- `bun create docusaurus@latest site classic --typescript` 로 스캐폴딩.
- 템플릿 기본 콘텐츠(tutorial-basics 등) 제거, 교안용 디렉터리 구조 생성.
- Mermaid(`@docusaurus/theme-mermaid`), KaTeX(`remark-math` + `rehype-katex`) 도입.
- 로케일을 `ko`(`ko-KR`)로 설정. 블로그를 `/log` 경로의 **개발 로그**로 용도 변경.
- 홈페이지 재작성 — 히어로, 컴파일러 파이프라인 도해, 6부 학습 로드맵 카드.
- 최신 동향 리서치 수행 후 `research/RESEARCH-NOTES.md` 에 출처와 함께 정리.
- 문서 작성: `intro`, `1. 컴파일러 개요`, `2. 언어와 문법`, `실습 환경 구성`.

**설계 판단**

- `markdown.format: 'detect'` — 교안 본문에 `{a, b}`, `<expr>` 같은 표기가 계속
  등장하는데 MDX가 이를 JSX로 해석해 빌드를 깬다. `.md` 는 CommonMark 로 처리하고,
  React 컴포넌트가 필요한 페이지만 `.mdx` 로 쓰기로 했다.
- `onBrokenLinks: 'warn'` (집필 기간 한정) — 앞 장이 뒷 장을 참조하는 구조라
  순서대로 쓰면 반드시 끊긴 링크가 생긴다. 처음부터 최종 URL 로 쓰고
  마지막에 `'throw'` 로 되돌려 한 번에 검증한다.
- 사이드바는 완성된 파트만 등록 — 어느 커밋에서도 사이트가 빌드되는 상태를 유지한다.

**검증**

- `bun run build` 통과. 경고는 아직 작성하지 않은 뒷장으로의 링크뿐.
- 실습 환경 확인: flex 2.6.4 / bison 2.3 / gcc / make (macOS).
  bison 2.3 은 오래된 버전이므로 `-Wcounterexamples` 를 쓰려면
  Homebrew bison 3.8+ 이 필요하다는 점을 실습 환경 문서에 명시.

### 2026-08-07 · 작업 4 — 2부 정규언어

**한 일**

- 인터랙티브 컴포넌트 3종 작성 (`site/src/components/automata/`).
  - `AutomatonDiagram` — 상태/간선 스펙에서 SVG 전이도를 그린다. 자기 고리,
    양방향 간선 자동 곡률 배분, 같은 방향 간선 라벨 병합, 활성 상태·간선 강조.
  - `AutomatonSimulator` — NFA/DFA 공용. 내부적으로 **항상 상태 집합**을 들고
    다니며 ε-closure 를 취하므로 DFA·NFA·ε-NFA 를 코드 하나로 처리한다.
    입력 테이프, 단계 이동, 수락/거부 판정, 사용자 입력 편집.
  - `SubsetConstruction` — 부분집합 구성을 한 행씩 진행하며 표를 채운다.
    Dragon Book 의 A~E 명명과 결과가 일치하는지 확인했다.
- 문서 4장 작성: 3. 정규언어 / 4. 정규 표현 / 5. 유한 오토마타 / 6. 정규언어의 표현 방법.
  5·6장은 React 컴포넌트를 쓰므로 `.mdx`, 나머지는 `.md`.

**빌드 중 발견해 고친 문제 두 가지**

1. **KaTeX 안의 `$` 가 수식을 조기 종료시킨다.**
   `$\text{$\varepsilon$-closure}(T)$` 처럼 `\text{}` 안에 `$` 를 넣으면
   remark-math 가 안쪽 `$` 를 닫는 구분자로 읽어 수식이 깨진다.
   `\varepsilon\text{-closure}` 형태로 바꿔 해결.

2. **Docusaurus 3 는 `:::tip 제목` 공백 제목 문법을 조용히 버린다.**
   빌드 경고 없이 `:::` 가 그대로 본문에 찍혀 나온다. 실험으로 확인한 결과
   `:::note`(제목 없음)와 `:::tip[제목]`(대괄호)만 동작한다.
   전체 문서의 admonition 58개를 대괄호 문법으로 일괄 변환했다.
   → 앞으로 admonition 은 반드시 `:::type[제목]` 으로 쓴다.

**검증**

- `bun run build` 통과.
- 로컬 서버 + 브라우저로 실제 렌더링 확인:
  Thompson NFA 11-상태 다이어그램의 곡선 라우팅, 시뮬레이터 단계 이동과
  수락 판정, 부분집합 구성 표 진행, admonition 58개 렌더링(잔여 리터럴 `:::` 0개).
- 다이어그램 viewBox 높이를 실제 내용에 맞게 줄여 아래쪽 빈 공간 제거.

### 2026-08-07 · 작업 5 — 3부 LEX + flex 실습

**한 일**

- 실습 하네스 구축: `examples/Makefile`, `examples/common/rules.mk`.
  `tests/NAME.in` / `NAME.expected` / `NAME.args` 규약으로 diff 비교.
- flex 예제 4종 작성 및 테스트 통과 (총 12케이스).
  - `01-lex-wordcount` — lex 파일 3부 구조
  - `02-lex-tokenizer` — 최장 일치·규칙 순서·catch-all
  - `03-dfa-by-hand` — 전이표 구동 / 직접 코딩 DFA, 두 구현 일치 검증
  - `04-lex-states` — 시작 조건, 중첩 주석, 이스케이프 해석, `<<EOF>>`
- 문서 3장 + 실습 페이지 작성: 7. LEX / 8. LEX 입력 및 파싱 /
  9. LEX 입력 파일 작성 / LEX 실습.

**문서에 실은 도구 출력은 모두 실제 실행 결과**

- `flex -v` 상태 수 (wordcount 15 NFA/7 DFA, tokenizer 273 NFA/92 DFA)
- `flex -d` 매치 추적 (`--accepting rule at line NN`)
- `flex -b` 되감기 보고서(`lex.backup`)
- 규칙 순서를 뒤집었을 때의 `rule cannot be matched` 경고

**설계 판단**

- `common/rules.mk` 에서 `LEX`/`YACC` 를 `?=` 가 아니라
  `$(origin ...)` 검사로 덮어썼다. make 는 `LEX=lex`, `YACC=yacc` 를
  내장 기본값으로 갖고 있어 `?=` 로는 바뀌지 않는다.
  특히 `yacc` 는 bison 의 yacc 호환 모드라 출력 파일 이름이 달라진다.
- 예제의 진단 출력 앞에 `fflush(stdout)` 을 넣었다.
  그러지 않으면 stdout 버퍼링 때문에 오류 줄이 전부 앞으로 몰려
  테스트 비교가 불안정해진다.

**검증**

- `cd examples && make test` — 4개 예제 12케이스 전부 통과.
- `bun run build` 통과.

### 2026-08-07 · 작업 6 — 4부 구문 분석

**한 일**

- 파싱 컴포넌트 4종 (`site/src/components/parsing/`).
  - `simulate.ts` — LL(1)·LR 알고리즘 본체를 React 와 분리한 순수 함수.
  - `simulate.test.ts` — **교안에 싣는 파싱 표를 기계로 검증한다.**
    유효 입력 12개 수락 / 무효 입력 8개 거부, `id + id * id` 의 축약 순서가
    `[6,4,2,6,4,6,3,1]` 인지, LL 과 LR 이 같은 언어를 인정하는지. 44개 통과.
  - `LLParser`, `LRParser` — 스택/입력/동작 추적표를 단계별로 표시.
  - `FirstFollow` — 고정점 계산을 라운드별로 표시.
- 예제 2종 추가.
  - `05-recursive-descent` — 손으로 쓴 LL(1) 계산기. `-t` 로 호출 추적.
  - `06-lr-table-driven` — 14장의 SLR 표를 그대로 옮긴 표 구동 파서.
    `-t` 로 스택/입력/동작 추적. 의미 값 스택으로 실제 계산까지 한다.
- 문서 6장: 10. CFG / 11. 문법의 유형 / 12. 구문 분석 / 13. LL / 14. LR /
  15. LR 파서의 구현.

**빌드 중 발견해 고친 문제**

- **remark-math 는 수식 안의 `\$` 를 이스케이프로 보지 않는다.**
  `$\mathrm{ACTION}[i, \$] = \textbf{accept}$` 에서 수식이 `\$` 에서 조기 종료되고,
  남은 `\textbf{accept}` 의 `{accept}` 가 MDX 표현식으로 해석되어
  `accept is not defined` 로 **빌드가 실패**했다.
  KaTeX 에 `$` 를 넣는 방법이 `\$` 와 `` \char`$ `` 뿐인데 둘 다 리터럴 `$` 를
  포함하므로, 입력 끝 기호가 들어가는 집합은 **수식 대신 코드 스팬**으로 적기로 했다.
  (`FOLLOW(E)` = `` `{ +, ), $ }` ``)

**설계 판단**

- 파싱 알고리즘을 `simulate.ts` 로 분리한 것은 **테스트 가능성** 때문이다.
  교재의 파싱 표가 한 칸이라도 틀리면 학습자가 며칠을 헤맨다.
  눈으로 검토하는 대신 `bun test` 로 확인한다.
- `bun test` 를 위해 `@types/bun` 을 추가하고 tsconfig 에 등록했다.
  `bun run check` = typecheck + test + build.

**검증**

- `bun test` 44개 통과, `npx tsc --noEmit` 오류 없음, `bun run build` 통과
  (끊긴 링크/앵커 0개).
- `cd examples && make test` — 6개 예제 20케이스 통과.
- 브라우저로 LR 시뮬레이터 14단계 추적이 `06-lr-table-driven` 의
  실제 실행 결과와 일치하는지 확인.

### 2026-08-07 · 작업 7 — 5부 YACC + 통합 프로젝트

**한 일**

- 예제 2종 추가.
  - `07-yacc-calc` — flex + bison 계산기. 모호한 문법 + 우선순위 선언으로
    **충돌 0개**. `%prec UMINUS`, `error` 토큰 복구, 심볼 테이블.
  - `08-mini-compiler` — **통합 프로젝트**. 소스 → 토큰 → AST → 타입 검사
    → 3-주소 코드. 파일 4개(mini.l/.y/.c/.h)로 컴파일러 6단계 중 ①~④.
- 문서 3장 + 실습 2페이지: 16. YACC 개요 / 17. 문법과 액션 /
  18. 충돌과 우선순위 / YACC 실습 / 통합 프로젝트.

**설계 판단**

- `07-yacc-calc` 에서 `%right UMINUS` 를 `%right '^'` **아래**가 아니라
  위에 두었다. 그래야 `-2^2 = -(2^2) = -4` 로 수학·파이썬 관례를 따른다.
  처음엔 반대로 두어 `4` 가 나왔고, 문서의 설명과 어긋나 바로잡았다.
- 줄 번호를 flex 의 `yylineno` 가 아니라 **파서가 직접** 세게 했다.
  `yylineno` 는 `\n` 을 매치하는 즉시 증가하는데, 그 `\n`(EOL)은 파서가
  lookahead 로 먼저 읽으므로 안쪽 축약의 액션에서는 이미 한 줄 앞서 있다.
  실제로 `1 / 0` 오류가 9행 대신 10행으로 보고되는 것을 확인하고 고쳤다.
- `08-mini-compiler` 는 dangling else 충돌 1개를 `%expect 1` 로 남겼다.
  단순한 경고 억제가 아니라 **회귀 방지 장치**라는 점을 문서에 명시했다.
- 파싱과 의미 분석·코드 생성을 **분리된 패스**로 두었다.
  액션은 `node_*()` 호출 한 줄만 하고 로직은 `mini.c` 에 둔다.

**검증**

- `cd examples && make test` — 8개 예제 26케이스 전부 통과.
- bison 충돌: `07` 0개, `08` 1개(`%expect 1` 로 선언됨).
- `bun run build` 통과. 남은 끊긴 링크는 아직 안 쓴 6부 2페이지뿐.

### 2026-08-07 · 작업 8·10 — 6부와 최종 검증

**한 일**

- 6부 2장: 19. 최신 경향과 연구 / 20. 도구 지형도.
  주장마다 각주로 원자료를 달았다(`research/RESEARCH-NOTES.md` 와 대응).
- 부록 2편: 용어 사전(한/영 대조 + 장 링크), 한 장 요약(알고리즘·옵션·흔한 실수).
- `onBrokenLinks` / `onBrokenAnchors` 를 `'throw'` 로 복구.
- 푸터 전체 링크 복원, README.md 작성.

**최종 점검에서 고친 것**

- 한국어 헤딩의 앵커 슬러그를 두 번 틀렸다.
  `### 모호성 제거 ② — dangling else` 의 슬러그는 `모호성-제거---dangling-else`
  (하이픈 **셋**). `②` 와 `—` 가 제거되며 남은 공백 셋이 하이픈이 된다.
  `### 예측 LL(*) / ALL(*)` 도 `예측-ll--all`.
  → 직접 세는 대신 빌드가 잡게 두는 편이 낫다. `throw` 로 되돌린 이유다.

**6부에서 정한 관점**

LLM 관련 서술에서 두 영역을 명확히 구분했다.
성과가 몰린 곳은 **최적화 휴리스틱 탐색과 auto-tuning**(정답이 여럿, 실행해 봐야 앎)이고,
어휘·구문 분석처럼 **결정론적 정확성**이 필요한 영역은 여전히 형식 문법의 것이다.
CompCert가 파서를 검증 대상에서 뺀 것(Menhir가 이미 검증된 파서를 준다)이
이론 확립의 실용적 가치를 보여 주는 방증으로 인용했다.

**최종 검증 결과**

| 검사 | 결과 |
|---|---|
| `bun run typecheck` | 오류 0 |
| `bun test` | 44 pass / 0 fail |
| `bun run build` | 성공, 끊긴 링크·앵커 0 (`throw` 모드) |
| `cd examples && make test` | 8개 예제 26케이스 전부 통과 |
| bison 충돌 | 07: 0개 / 08: 1개(`%expect 1` 로 선언) |

**최종 산출물**

- 교안 20장 + 실습 4페이지 + 부록 2편
- 실행 가능한 예제 8개 (flex 4, 손코딩 C 2, flex+bison 2)
- 인터랙티브 컴포넌트 6종 (오토마타 3, 파싱 3)
- 개발 로그 3편, 리서치 노트 1편
