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
| 5 | 3부 — LEX 3개 장 + flex 실습 코드 | ⬜ 예정 |
| 6 | 4부 — CFG, 문법 유형, 구문 분석, LL, LR, LR 구현 | ⬜ 예정 |
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
