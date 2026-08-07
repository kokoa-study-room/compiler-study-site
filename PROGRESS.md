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
| 7 | 5부 — YACC 3개 장 + bison 실습, 통합 미니 컴파일러 | ⬜ 예정 |
| 8 | 6부 — 최신 경향과 연구, 도구 지형도 | ⬜ 예정 |
| 9 | 실습 하네스 — examples/ 빌드·테스트 자동화 | ⬜ 예정 |
| 10 | 최종 검증 — 링크 `throw` 복구, 전체 빌드, README 정리 | ⬜ 예정 |

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
