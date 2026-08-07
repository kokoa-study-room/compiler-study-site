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
| 4 | 2부 — 정규언어, 정규 표현, 유한 오토마타, 표현 방법 | ⬜ 예정 |
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
