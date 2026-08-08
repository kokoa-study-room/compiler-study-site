#!/usr/bin/env bun
/**
 * 문서 정합성 검사 — 빌드는 통과하지만 결과가 틀리는 문제들을 잡는다.
 *
 *  1. 인라인 수식 안의 `\$`      → remark-math 가 거기서 수식을 끊는다 (조용히 깨짐)
 *  2. 수식 안의 `\|`             → KaTeX 가 이중선 ‖ 로 렌더링한다
 *  3. 공백 제목 admonition       → Docusaurus 3 가 경고 없이 버린다
 *  4. 이중 백틱 코드 스팬 `` `x` `` → 백틱이 본문에 그대로 찍힌다
 *  5. 링크 표시 장 번호 불일치    → 재번호 후 앵커만 고치면 남는다
 *  6. 헤딩 안의 수식             → 목차에 원본 LaTeX 이 노출된다
 *  7. 확인 문제 수 ≠ 해설 수      → 풀이가 빠진 장
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DOCS = join(import.meta.dir, '..', 'docs');

/** 파일 경로(확장자 제외) → 장 번호 */
const CHAPTER: Record<string, number> = {
  'foundations/compiler-overview': 1,
  'foundations/language-and-grammar': 2,
  'regular/regular-languages': 3,
  'regular/regular-expressions': 4,
  'regular/finite-automata': 5,
  'regular/representations': 6,
  'lex/lex-overview': 7,
  'lex/lex-input-and-parsing': 8,
  'lex/writing-lex-files': 9,
  'parsing/context-free-grammar': 10,
  'parsing/grammar-hierarchy': 11,
  'parsing/syntax-analysis': 12,
  'parsing/ll-parsing': 13,
  'parsing/operator-precedence': 14,
  'parsing/lr-parsing': 15,
  'parsing/lr-parser-implementation': 16,
  'parsing/syntax-directed-translation': 17,
  'yacc/yacc-overview': 18,
  'yacc/yacc-grammar-and-actions': 19,
  'yacc/conflicts-and-precedence': 20,
  'modern/trends': 21,
  'modern/toolchain-map': 22,
};

type Issue = { file: string; line: number; rule: string; text: string };
const issues: Issue[] = [];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.mdx?$/.test(name) ? [p] : [];
  });
}

const LINK = /\[(\d+)((?:\.|장)?[^\]]*)\]\(\/docs\/([a-z\-/]+?)(?:#[^)]*)?\)/g;

for (const path of walk(DOCS)) {
  const file = relative(DOCS, path);
  const src = readFileSync(path, 'utf8');
  const lines = src.split('\n');

  let inDisplayMath = false;
  let inCodeFence = false;
  let problems = 0;
  let solutions = 0;

  let inExercises = false;
  let detailsDepth = 0;

  lines.forEach((line, idx) => {
    const n = idx + 1;
    const add = (rule: string) => issues.push({ file, line: n, rule, text: line.trim().slice(0, 100) });
    const t = line.trim();

    if (t.startsWith('```')) inCodeFence = !inCodeFence;
    if (inCodeFence) return;

    // 확인 문제 / 해설 세기 — <details> 안의 번호 목록은 문제가 아니다
    if (t === '## 확인 문제') inExercises = true;
    if (inExercises) {
      if (t.startsWith('<details')) detailsDepth++;
      if (t === '</details>') detailsDepth--;
      if (t === '<summary>풀이</summary>') solutions++;
      if (detailsDepth === 0 && /^\d+\. /.test(t)) problems++;
    }

    // 수식 판정 — 한 줄짜리 $$…$$ 도 디스플레이 수식이다
    if (t === '$$') { inDisplayMath = !inDisplayMath; return; }
    if (inDisplayMath) return;
    if (t.startsWith('$$') && t.endsWith('$$') && t.length > 4) return; // 한 줄짜리 디스플레이 수식
    // 코드 스팬 안의 내용은 수식이 아니다
    const bare = line.replace(/`[^`]*`/g, '');

    // 1. 인라인 수식 안의 \$ — 수식이 거기서 끊긴다
    if (/\$[^$]*\\\$/.test(bare)) add('인라인 수식 안의 \\$ (코드 스팬으로 바꿀 것)');

    // 2. 수식 안의 \| — KaTeX 가 ‖ 로 그린다
    if (/\$[^$]*\\\|/.test(bare)) add('수식 안의 \\| (\\mid 또는 \\lvert \\rvert 로 바꿀 것)');

    // 3. 공백 제목 admonition — 조용히 버려진다
    if (/^:::(note|tip|info|caution|danger|warning)\s+\S/.test(t)) add('admonition 제목은 대괄호로');

    // 4. 이중 백틱 코드 스팬 — 백틱이 본문에 찍힌다
    if (/`` `[^`]+` ``/.test(line)) add('이중 백틱 코드 스팬');

    // 5. 링크 표시 장 번호
    for (const m of line.matchAll(LINK)) {
      const [, num, label, target] = m;
      if (label.startsWith('부') || label.startsWith('·')) continue; // "3부", "4·5부"
      const real = CHAPTER[target.replace(/\/$/, '')];
      if (real !== undefined && Number(num) !== real) {
        add(`장 번호 불일치: [${num}] → ${target} (실제 ${real}장)`);
      }
    }

    // 6. 헤딩 안의 수식 — 목차에 LaTeX 이 노출된다
    if (/^#{1,4} /.test(t) && /\$[^$]+\$/.test(t.replace(/`[^`]*`/g, ''))) {
      add('헤딩 안의 수식 (제거하고 {#id} 를 달 것)');
    }
  });

  if (inExercises && problems !== solutions) {
    issues.push({ file, line: 0, rule: `확인 문제 ${problems}개 / 해설 ${solutions}개`, text: '' });
  }
}

if (issues.length === 0) {
  console.log('✓ lint-docs: 문제 없음');
  process.exit(0);
}

for (const i of issues) {
  console.error(`${i.file}:${i.line}  ${i.rule}\n    ${i.text}`);
}
console.error(`\n✗ lint-docs: ${issues.length}건`);
process.exit(1);
