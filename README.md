# 컴파일러 학습 노트

정규 문법부터 LR 파서까지, 이론과 lex/yacc 실습으로 완성하는 컴파일러 프론트엔드 교안.

**→ [compiler-study.shinkeonkim.com](https://compiler-study.shinkeonkim.com)**

> 고급 언어 프로그램을 기계어나 어셈블리어로 번역해 주는 소프트웨어인 컴파일러를
> 구성하는 방법을 배우고 실습한다. 컴파일러 구현에 필요한 개념으로 정규 문법,
> 문맥 자유 문법, Finite Automata, Pushdown Automata 등 이론적 지식을 기반으로
> 컴파일러 자동화 도구인 lex, yacc의 사용법을 익히고 이를 활용하여 파서를 구현한다.

---

## 무엇이 들어 있나

| 디렉터리 | 내용 |
|---|---|
| `site/` | Docusaurus 3 (TypeScript) 문서 사이트 — 교안 22장 + 실습 4페이지 + 부록. 오프라인 검색 포함 |
| `examples/` | 실행 가능한 예제 11개. 전부 `make test` 로 검증된다 |
| `research/` | 최신 동향 조사의 1차 자료와 출처 |
| `PROGRESS.md` | 작업 단위별 진행 기록과 설계 판단 |

### 교안 구성

| 부 | 장 |
|---|---|
| **시작** | 들어가며 · 시작하기 전에 (필요한 C 문법과 이산수학) |
| **1부 기초** | 1. 컴파일러 개요 · 2. 언어와 문법 |
| **2부 정규언어** | 3. 정규언어 · 4. 정규 표현 · 5. 유한 오토마타 · 6. 정규언어의 표현 방법 |
| **3부 LEX** | 7. LEX · 8. LEX 입력 및 파싱 · 9. LEX 입력 파일 작성 |
| **4부 구문 분석** | 10. 문맥 자유 문법 · 11. 문법의 유형 · 12. 구문 분석 · 13. LL 구문 분석 · 14. 연산자 우선순위 파싱 · 15. LR 구문 분석 · 16. LR 파서의 구현 · 17. 구문 지향 번역 |
| **5부 YACC** | 18. YACC 개요 · 19. 문법과 액션 · 20. 충돌과 우선순위 |
| **6부 심화** | 21. 최신 경향과 연구 · 22. 도구 지형도 |
| **부록** | 용어 사전 · 한 장 요약 · 참고 문헌 |
| **실습** | 실습 환경 구성 · LEX 실습 · YACC 실습 · 통합 프로젝트 |

### 실습 예제

| 디렉터리 | 주제 |
|---|---|
| `01-lex-wordcount` | lex 입력 파일의 3부 구조, `yytext`/`yyleng` |
| `02-lex-tokenizer` | C 부분집합 토크나이저 — 최장 일치, 규칙 순서, catch-all |
| `03-dfa-by-hand` | 전이표 구동 / 직접 코딩 DFA를 손으로 작성하고 두 구현의 일치 검증 |
| `04-lex-states` | 시작 조건, 중첩 주석, 이스케이프 해석, `<<EOF>>` 진단 |
| `05-recursive-descent` | 손으로 쓴 LL(1) 재귀 하강 계산기 (AST + 호출 추적) |
| `06-lr-table-driven` | 15장의 SLR 표를 그대로 옮긴 표 구동 LR 파서 |
| `07-yacc-calc` | flex + bison 계산기 — 우선순위 선언, `error` 토큰 복구 |
| `08-mini-compiler` | **통합 프로젝트** — 소스 → 토큰 → AST → 타입 검사 → 3-주소 코드 |
| `09-lex-reentrant` | `%option reentrant` — 스캐너 인스턴스 셋을 동시에 굴린다 |
| `10-operator-precedence` | 우선 관계 표를 C 배열로 — `06` 과 나란히 비교 |
| `11-attribute-eval` | 속성 평가 순서 — 의존 그래프 위상 정렬 |

---

## 시작하기

### 내려받기

```bash
git clone https://github.com/kokoa-study-room/compiler-study-site.git
cd compiler-study-site
```

바로 확인해 보려면:

```bash
cd examples && make test
```

`모든 예제 테스트 통과` 가 나오면 준비가 끝난 것이다.
자세한 설치 안내는 교안의
[실습 환경 구성](https://compiler-study.shinkeonkim.com/docs/labs/setup)에 있다.

### 요구 사항

- [bun](https://bun.sh/) 1.x — 사이트 빌드
- `flex`, `bison`, C 컴파일러, `make` — 예제 빌드

macOS라면 `xcode-select --install` 로 flex/bison/cc/make가 모두 들어온다.
자세한 설치 안내는 교안의 **실습 환경 구성** 문서에 있다.

### 사이트

```bash
cd site
bun install
bun start          # 개발 서버 (http://localhost:3000)
bun run build      # 정적 사이트 빌드
bun run serve      # 빌드 결과 미리보기
```

### 예제

```bash
cd examples
make               # 전체 빌드
make test          # 전체 테스트 (11개 예제, 34케이스)
make clean
```

개별 예제만:

```bash
cd examples/08-mini-compiler
make && make test
./minic    < tests/basic.in      # 3-주소 코드
./minic -a < tests/ast.in        # AST 도 함께
```

### 전체 검증

```bash
cd site && bun run check     # lint + typecheck + bun test + build + lint:build
cd ../examples && make test
```

**빌드는 통과하는데 결과가 틀리는** 문제를 두 단계로 잡는다.

| 검사 | 보는 것 | 잡는 것 |
|---|---|---|
| `bun run lint` | 마크다운 원본 | 아래 "알아 둘 함정" 1~9 |
| `bun test` | 코드 + 교안의 표 | 파싱 표가 교안·컴포넌트·예제 C 배열에서 모두 같은가 |
| `bun run lint:build` | **빌드된 HTML** | 원본은 멀쩡한데 렌더링에서 깨진 것 |

인쇄도 고려했다. 확인 문제 풀이 125개가 전부 `<details>` 안에 있어
그대로 두면 **종이에는 풀이가 한 줄도 나오지 않는다.**
인쇄 직전에 전부 펼치고 끝나면 되돌린다 (`src/clientModules/printSetup.ts`).

마지막 것이 필요한 이유가 있다. `.md`(CommonMark)에서 서식이 든
admonition 제목이 **39곳에서 통째로 버려지고 있었는데**,
원본만 봐서는 알 수 없고 빌드도 성공하고 경고도 없었다.

---

## 이 교안의 원칙

**이론과 도구를 짝지어 배운다.**
정규 표현과 유한 오토마타를 배우면 곧바로 `flex -v`, `flex -T` 로
lex가 그것을 어떻게 자동화하는지 확인한다.
LR 항목 집합을 배우면 곧바로 `bison -v` 의 `.output` 과 대조한다.

**수식은 반드시 "읽는 법"과 함께 준다.**
정의를 적어 놓고 넘어가지 않는다. $\delta : Q \times \Sigma \to Q$ 의 화살표를
어떻게 읽는지, 펌핑 보조정리의 $\exists p\ \forall w\ \exists(x,y,z)\ \forall i$ 에서
누가 무엇을 고르는지, 재귀 정의를 어느 쪽부터 펼치는지를 매번 적는다.
2부(3~5장)에 "수식 읽는 법" 블록이 14개 있다.

**손으로 한 번, 도구로 한 번.**
NFA→DFA 부분집합 구성도, LR(0) 항목 집합도 먼저 종이 위에서 돌려 본 뒤
도구가 뱉은 실제 표와 비교한다.

**문서에 실린 도구 출력은 전부 실제 실행 결과다.**
`flex -v` 의 상태 수, `flex -d` 의 매치 추적, `bison` 의 충돌 보고서,
예제 프로그램의 출력 — 지어낸 것이 하나도 없다.

**파싱 표는 기계로 검증한다.**
같은 표가 네 군데에 있다 — 교안 마크다운, 시뮬레이터, 예제 C 배열, 그리고 문서의 설명.
`doc-tables.test.ts` 가 **교안의 표를 직접 읽어** 나머지와 한 칸씩 대조한다.
한 곳을 고치고 나머지를 잊으면 테스트가 깨진다 (97개 테스트).

**인터랙티브하게 만든다.**
부분집합 구성, DFA/NFA 시뮬레이션, FIRST/FOLLOW 고정점 계산,
LL·LR 파싱 스택, 우선 관계 표, 속성 평가 순서 —
글로 읽는 것보다 한 단계씩 눌러 보는 편이 빠르다.
알고리즘은 전부 React 밖의 순수 함수로 두고 `bun test` 로 검증한다.

**모든 확인 문제에 풀이가 있다.**
20개 장의 문제 128개에 접이식 해설을 달았다.
먼저 풀어 본 뒤 펼쳐 보는 방식이라 학습 효과를 해치지 않는다.
계산 문제는 과정까지, 증명 문제는 완전한 증명으로 적었다.

---

## 기술 선택

| 선택 | 이유 |
|---|---|
| **Docusaurus 3 + TypeScript + bun** | 순서가 있는 긴 문서에 사이드바 모델이 잘 맞고, 검색·다크 모드·MDX가 기본 제공된다 |
| **Mermaid** | 상태 전이도·파스 트리를 이미지가 아니라 텍스트로 관리한다. diff에 남고 다크 모드에 자동 대응한다 |
| **KaTeX** | $\Sigma^*$, $\delta(q,a)$ 같은 표기가 검색·복사 가능해야 한다 |
| **`markdown.format: 'detect'`** | 교안 본문의 `{a, b}`, `<expr>` 표기가 MDX의 JSX로 해석되지 않도록 `.md`는 CommonMark로 처리 |
| **`onBrokenLinks: 'throw'`** | 장 사이 상호 참조가 많아 링크 검사가 곧 회귀 테스트다 |
| **`@easyops-cn/docusaurus-search-local`** | 22장 9만 낱말이라 검색이 없으면 찾아 들어갈 수 없다. 오프라인 색인이라 외부 서비스가 필요 없다 |
| **`src/theme/Admonition`** | `.md` 에서 서식이 든 admonition 제목이 버려지는 문제를 고친 스위즐 |

---

## 알아 둘 함정 열한 가지 — 검사가 잡아 준다

작업하면서 겪은, **빌드는 통과하는데 결과가 틀리는** 문제들이다.
`site/scripts/lint-docs.ts` 가 전부 검사하므로 외울 필요는 없지만,
왜 그런지는 알아 두는 편이 낫다.

### 1. admonition 제목은 반드시 대괄호로

```md
:::tip 제목        ❌ 경고 없이 무시되고 ::: 가 본문에 그대로 찍힌다
:::tip[제목]       ✅
```

Docusaurus 3(MDX v3)에서 공백 제목 문법이 조용히 버려진다.

### 2. 인라인 수식 안에 `$` 를 넣지 말 것

```md
$\text{$\varepsilon$-closure}(T)$     ❌ 안쪽 $ 에서 수식이 끊긴다
$\varepsilon\text{-closure}(T)$       ✅

$\mathrm{FOLLOW}(S) = \{\$\}$        ❌ 원본 LaTeX 이 그대로 노출된다
`FOLLOW(S) = {$}`                     ✅ 코드 스팬으로
```

remark-math는 `\$` 를 이스케이프로 보지 않는다.
`.mdx` 에서는 끊긴 수식 뒤의 `{...}` 가 JSX로 해석되어 빌드가 실패하고,
`.md` 에서는 **경고 없이 잘못 렌더링된다.** 후자가 더 위험하다.

`$$ … $$` **디스플레이 수식 안에서는 괜찮다.** 구분자가 `$$` 라서 끊기지 않는다.

### 3. 수식 안의 `|` 는 `\mid` 또는 `\lvert` `\rvert` 로

```md
$\|xy\| \leq p$          ❌ KaTeX에서 ‖xy‖ (이중선)로 렌더링된다
$\lvert xy \rvert \leq p$ ✅
$N(a\|b)$                 ❌ N(a‖b) 로 보인다
$N(a \mid b)$              ✅
```

Markdown 표 안에서는 맨 `|` 가 열 구분자가 되므로 `\|` 로 escape해야 하는데,
그러면 KaTeX가 이중선으로 해석한다.
파이프 문자를 아예 쓰지 않는 표기로 통일하면 두 문제가 함께 해결된다.

### 4. 헤딩에 수식을 넣지 말 것

목차(TOC)에는 KaTeX가 적용되지 않아 **원본 LaTeX이 그대로 노출**된다.

```md
### 증명 예제 — $\{a^nb^n\}$ 은 정규가 아니다     ❌ TOC에 \(a^n b^n\) 로 보인다
### 증명 예제 — `{aⁿbⁿ}` 은 정규가 아니다 {#proof-anbn}   ✅
```

한국어 헤딩은 슬러그를 예측하기 어려우므로(`②`, `—` 가 제거되며 하이픈이 늘어난다)
자주 참조되는 헤딩에는 `{#id}` 로 **명시적 id**를 달아 두는 편이 안전하다.

### 5. 장 번호를 바꾸면 링크 **표시 문자**도 바꿔야 한다

```md
[15. LR 파서의 구현](/docs/parsing/lr-parser-implementation)   ❌ 그 문서는 16장이다
```

앵커가 유효하므로 `onBrokenLinks` 가 못 잡는다.
lint가 경로 → 장 번호 대응표를 들고 검사한다.

### 6. 수식 안에 `①②③` 을 쓰지 말 것

KaTeX 폰트에 없어서 `No character metrics` 경고와 함께 깨진다.
`\text{구역 1}` 처럼 쓰자. 본문에서는 문제없다.

### 7. 확인 문제 수 = 해설 수

절을 새로 쓰면 확인 문제도 같이 늘리고, 해설을 반드시 붙인다.
lint가 장마다 개수를 대조한다.

### 8. 코드 스팬 안에는 LaTeX 매크로를 쓰지 말 것

```md
| `(a\lvert b)*abb` |     ❌ 백틱 안이므로 \lvert 가 글자 그대로 찍힌다
| `(a\|b)*abb` |          ✅ 표 안에서는 \| 로 escape
```

수식 안의 `\|` 를 일괄 치환하다 백틱 안까지 건드린 적이 있다.

### 9. 표 안에서 수식이 `|` 로 잘리지 않게

```md
| 소박한 분할 정제 | $O(n^2 \cdot |\Sigma|)$ |        ❌ 셋으로 찢어진다
| 소박한 분할 정제 | $O(n^2 \cdot \lvert \Sigma \rvert)$ |  ✅
```

셀로 쪼갠 뒤 `$` 개수가 홀수인 셀이 있으면 수식이 잘린 것이다. lint가 그렇게 센다.

### 10. 절을 새로 쓰면 용어 사전도 같이 갱신할 것

```md
**부트스트랩(bootstrapping)** 은 …     ← 이렇게 정의해 놓고
```

용어 사전에 없으면 lint가 잡는다.
절을 새로 쓰면서 사전을 잊는 일이 **세 번 반복돼서** 규칙으로 넣었다.
문장 속 번역일 뿐 용어가 아니면 `NOT_A_TERM` 에 한 줄 적는다.

### 11. 용어 사전에 없는 말을 지어내지 말 것

```md
| 완전 DFA | total DFA | … | [5](/docs/regular/finite-automata) |   ❌ 본문은 "전함수"라고 쓴다
| 전함수   | total function | … | [5](…) |                          ✅
```

링크는 유효하므로 `onBrokenLinks` 가 잡지 못한다.
lint가 **사전의 한국어 표기가 링크한 장의 본문에 실제로 있는지** 확인한다.

---

## 라이선스

교육용 자료. 참고 문헌의 저작권은 각 저자에게 있다.
