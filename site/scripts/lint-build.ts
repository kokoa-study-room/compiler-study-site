#!/usr/bin/env bun
/**
 * 빌드 결과 검사 — **원본만 봐서는 알 수 없는** 문제를 잡는다.
 *
 * `lint-docs.ts` 는 마크다운 원본을 본다. 그런데 원본이 멀쩡해도
 * 렌더링 단계에서 조용히 망가지는 것들이 있다. 실제로 겪은 것들:
 *
 *   - `.md`(CommonMark)에서 서식이 든 admonition 제목이 통째로 버려짐 (39곳)
 *   - 수식이 끊겨 원본 LaTeX 이 글자 그대로 노출됨
 *   - `:::` 가 본문에 그대로 찍힘
 *
 * 전부 빌드는 성공하고 경고도 없다. 그래서 HTML을 직접 본다.
 *
 *   bun run lint:build      (bun run check 가 빌드 뒤에 자동으로 부른다)
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const BUILD = join(import.meta.dir, '..', 'build');

if (!existsSync(BUILD)) {
  console.error('build/ 가 없다. 먼저 `bun run build` 를 실행할 것.');
  process.exit(1);
}

type Issue = { page: string; rule: string; sample: string };
const issues: Issue[] = [];

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return htmlFiles(p);
    return name === 'index.html' ? [p] : [];
  });
}

/** KaTeX 가 만든 마크업을 지운 뒤의 "사람이 읽는 본문" */
function readableText(html: string): string {
  let s = html;
  s = s.replace(/<article[\s\S]*?<\/article>/g, (m) => m); // 유지 (가독성용)
  s = s.replace(/<span class="katex-mathml">[\s\S]*?<\/span>/g, '');
  s = s.replace(/<annotation[\s\S]*?<\/annotation>/g, '');
  s = s.replace(/<script[\s\S]*?<\/script>/g, '');
  s = s.replace(/<style[\s\S]*?<\/style>/g, '');
  return s;
}

/** 본문 영역만 — 검색 색인이나 메타 태그의 원본 텍스트는 제외한다.
 *  코드 블록·코드 스팬은 "글자 그대로 보여 주는 것"이 목적이므로 뺀다.
 *  개발 로그는 깨진 예를 일부러 인용하므로 아예 검사하지 않는다. */
function articleOf(html: string): string {
  const m = html.match(/<article[\s\S]*?<\/article>/);
  if (!m) return '';
  return m[0]
    .replace(/<pre[\s\S]*?<\/pre>/g, ' ')
    .replace(/<code[\s\S]*?<\/code>/g, ' ');
}

const LATEX_LEAK = /\\(?:lvert|rvert|mathrm|varepsilon|mathbf|text|quad|cdot|to|Sigma|emptyset|alpha|beta|gamma)\b/;

for (const file of htmlFiles(BUILD)) {
  const page = '/' + relative(BUILD, file).replace(/\/index\.html$/, '');
  if (page.startsWith('/log')) continue;   // 개발 로그는 깨진 예를 인용한다
  const html = readFileSync(file, 'utf8');
  const article = readableText(articleOf(html));
  if (!article) continue;

  const add = (rule: string, sample: string) =>
    issues.push({ page, rule, sample: sample.replace(/\s+/g, ' ').slice(0, 90) });

  // 1. 제목이 버려진 admonition — 본문 앞에 <mdxadmonitiontitle> 로 남는다
  const dropped = article.match(/<mdxadmonitiontitle>([\s\S]*?)<\/mdxadmonitiontitle>/g);
  if (dropped) {
    for (const d of dropped) {
      add('admonition 제목이 본문으로 밀렸다', d.replace(/<[^>]+>/g, ''));
    }
  }

  // 2. 원본 LaTeX 노출 — 수식이 끊겼거나 코드 스팬에 매크로가 들어갔다
  const text = article.replace(/<[^>]+>/g, ' ');
  const leak = text.match(new RegExp(`[^\\s]{0,30}${LATEX_LEAK.source}[^\\s]{0,30}`));
  if (leak) add('원본 LaTeX 이 그대로 노출됐다', leak[0]);

  // 3. admonition 구분자가 본문에 찍혔다
  if (/(^|\s):::(\s|$)/.test(text)) {
    const m = text.match(/.{0,40}:::.{0,40}/);
    add('::: 가 본문에 찍혔다', m?.[0] ?? ':::');
  }

  // 4. MDX 표현식이 문자열로 남았다 (컴포넌트가 마운트되지 않은 경우)
  if (/\{\s*(?:exprGrammar|opGrammar|scenarios|opPrecTable)\b/.test(text)) {
    add('컴포넌트 props 가 글자로 남았다', text.match(/.{0,40}\{\s*expr.{0,30}/)?.[0] ?? '');
  }
}

if (issues.length === 0) {
  console.log(`✓ lint-build: 문제 없음 (${htmlFiles(BUILD).length}개 페이지)`);
  process.exit(0);
}

for (const i of issues) {
  console.error(`${i.page}\n    ${i.rule}: ${i.sample}`);
}
console.error(`\n✗ lint-build: ${issues.length}건`);
process.exit(1);
