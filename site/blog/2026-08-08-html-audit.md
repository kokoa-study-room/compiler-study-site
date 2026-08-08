---
slug: html-audit
title: 네 번째 감사 — 빌드된 HTML을 읽었더니
authors: [course]
tags: [content, tooling]
date: 2026-08-08
---

이번에는 마크다운 원본이 아니라 **빌드된 HTML**을 읽는 검사를 만들었다.

첫 실행에서 39곳이 나왔다.

<!-- truncate -->

## 제목이 통째로 사라지고 있었다

```md
:::info[정의 — 알파벳 $\Sigma$ 위의 정규 표현]
```

이렇게 쓴 admonition이 화면에는 이렇게 나오고 있었다.

```
① 정보
정의 — 알파벳 Σ 위의 정규 표현
기본
...
```

제목 자리에는 **기본 라벨 "정보"** 가 나오고, 제목 글은 본문 첫 줄에
아무 스타일 없이 붙었다.

빌드는 성공한다. 경고도 없다. 링크 검사도 통과한다.

### 왜 그런가

HTML을 뜯어 보니 답이 있었다.

```html
<div class=admonitionHeading_Gvgb>…주의</div>
<div class=admonitionContent_BuS1>
  <mdxadmonitiontitle><code>ab*</code> 와 <code>(ab)*</code> 는 완전히 다르다</mdxadmonitiontitle>
  ...
```

제목에 서식(백틱·수식·굵게)이 들어가면 remark는 제목을 순수 문자열로 넘기지 못한다.
그래서 `mdxAdmonitionTitle` 이라는 요소로 감싸 본문 앞에 넣고,
테마가 그것을 찾아 제목 자리로 끌어올리는 방식으로 처리한다.

테마의 코드는 이렇다.

```js
const wrapper = items.find(
  (item) => React.isValidElement(item) && item.type === 'mdxAdmonitionTitle'
);
```

**camelCase 로 찾는다.** 그런데 HTML에는 `<mdxadmonitiontitle>` — 전부 소문자다.

`markdown.format: 'detect'` 때문이었다. 이 교안은 본문에 `{a, b}` 와 `<expr>` 이
자주 나와서 `.md` 는 CommonMark 로 처리하도록 해 두었는데,
**그 경로에서 요소 이름이 소문자로 내려온다.**

확인해 보니 정확히 갈렸다.

```
.mdx 파일 7개  → 0곳 깨짐
.md  파일 12개 → 39곳 깨짐
```

### 고치기

내용을 39곳 고치는 대신 테마를 스위즐했다.

```tsx
const wrapper = items.find(
  (item) =>
    React.isValidElement(item) &&
    (item.type as unknown as string) === 'mdxadmonitiontitle',
);
```

제목 있는 admonition 325개 중 버려진 것 **0개**가 되었다.

## 검색이 없었다

`docusaurus.config.ts` 에 이렇게 적혀 있었다.

```ts
{
  type: 'search',
  position: 'right',
},
```

그런데 검색창이 렌더되지 않는다. 이 항목은 **자리만 잡는 것**이고,
실제 UI는 검색 플러그인이 넣어 준다. 플러그인이 없으면 아무것도 안 나오고,
경고도 없다.

22장 9만 낱말짜리 사이트에 검색이 없었던 것이다.

`@easyops-cn/docusaurus-search-local` 를 넣었다. 오프라인 색인이라
외부 서비스가 필요 없고, `lunr.ko.js` 가 딸려 있어 한국어도 된다.

"백패칭"으로 검색하니 7건이 **절 단위**로 잡힌다.

```
해결 — 백패칭                    19. 문법과 액션
19.8 백패칭 — 단축 평가와 점프 코드    19. 문법과 액션
백패칭 (backpatching…            19. 문법과 액션
… backpatching 점프 대상을 비워 두고 …  용어 사전
```

UI 문자열 55개도 한국어로 옮겼다 (`검색`, `이전`/`다음`, `복사`, `참고`/`주의`/`위험` …).

## 같은 표가 네 군데에 있었다

SLR(1) 표 하나가 이렇게 흩어져 있다.

| 어디 | 무엇 |
|---|---|
| `docs/parsing/lr-parsing.mdx` | 사람이 읽는 마크다운 표 |
| `src/components/parsing/grammars.ts` | 시뮬레이터가 쓰는 것 |
| `examples/06-lr-table-driven/lrparse.c` | 실제로 실행되는 C 배열 |

하나를 고치고 나머지를 잊으면 **교안이 거짓말을 하게 된다.**
타입 검사도 링크 검사도 이건 못 잡는다.

그래서 테스트가 **교안의 마크다운 표를 직접 파싱**하게 했다.

```ts
const rows = tableRows(md, '### 완성된 표');

rows.forEach((row, state) => {
  TERMS.forEach((term, i) => {
    const cell = clean(row[1 + i]);          // "s5", "r2", "acc", ""
    const actual = exprSLRTable.action[state]?.[term];
    ...
  });
});
```

SLR(1)·LL(1)·우선 관계 표 셋과 C 배열 둘, 합쳐서 97개 테스트.
표의 한 칸을 일부러 `s7` → `s8` 로 바꿔 보니 이렇게 나온다.

```
error: 상태 2, * 열
Expected: { t: 'shift', to: 7 }
Received: { t: 'shift', to: 8 }
```

## 지난 감사가 남긴 상처

2차 감사에서 수식 안의 `\|` 를 37곳 일괄 치환했었다.
그 치환이 **백틱 안까지 건드렸다.**

```md
| `(a\lvert b)(a \rvertb)` | 길이 2인 모든 스트링 |
```

코드 스팬 안이므로 `\lvert` 는 매크로가 아니라 그냥 글자다.
4장의 정규 표현 대표 표가 이렇게 보이고 있었다.

```
(a\lvert b)(a \rvertb)     길이 2인 모든 스트링
```

3·4장 5곳. 표 안에서는 `` `(a\|b)` `` 처럼 escape 해야 맞다.

반대 방향의 실수도 하나 있었다.

```md
| 소박한 분할 정제 | $O(n^2 \cdot |\Sigma|)$ |
```

수식 안의 맨 `|` 가 **열 구분자로 먹혀** 셀이 셋으로 찢어지고,
본문에 `\cdot` 이 노출됐다.

이건 정확히 잡을 수 있다 — 셀로 쪼갠 뒤 `$` 개수가 홀수인 셀이 있으면 수식이 잘린 것이다.

```ts
const cells = line.replace(/`[^`\n]*`/g, '').slice(1, -1).split('|');
const split = cells.find((c) => (c.match(/\$/g) ?? []).length % 2 === 1);
```

## 읽기 부담을 재 보았다

1학년 눈높이가 걱정이라면 문장을 세어 보는 것이 빠르다.

```
장                    문장   평균낱말  25낱말 초과
1  컴파일러 개요        145     9.8      3
5  유한 오토마타        141    10.9      5
15 LR                240     9.1      1
19 문법과 액션         169     9.2      1
```

평균 8~11 낱말, 긴 문장은 장당 0~5개. **문장 자체는 문제가 없었다.**

다만 15장의 절별 분량을 보니 이랬다.

```
 457  15.1 이동-축약 파싱
 139  15.2 LR(0) 항목
1233  15.3 정준 LR(0) 항목 집합
 456  15.4 SLR(1) 표 만들기
 191  15.5 직접 돌려 보기
 182  15.6 충돌
1974  15.7 LR(1)과 LALR(1)   ← 앞의 여섯 절을 합친 것과 비슷
```

15.1~15.6 은 그 자체로 완결된 이야기(SLR)이고, 15.7 은 두 번째 이야기다.
장을 쪼개는 대신 그 자리에 쉬어 가는 안내를 넣었다.

## 검사가 세 층이 되었다

| 검사 | 보는 것 |
|---|---|
| `bun run lint` | 마크다운 **원본** — 규칙 10개 |
| `bun test` | 코드 + **교안의 표** — 97개 |
| `bun run lint:build` | 빌드된 **HTML** |

세 번째가 이번에 새로 만든 것이고, admonition 39곳을 잡은 것도 그것이다.

원본을 아무리 들여다봐도 알 수 없는 종류가 있다.
**결과물을 봐야 하는 것은 결과물을 봐야 한다.**

```bash
cd site && bun run check      # lint + typecheck + 97 tests + build + lint:build
cd examples && make test      # 11개 예제 34케이스
```
