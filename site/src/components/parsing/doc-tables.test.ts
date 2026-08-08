/**
 * 교안에 실린 표 = 컴포넌트의 표 = 예제 C 배열 — 셋이 같은지 검증한다.
 *
 * 같은 파싱 표가 지금 네 군데에 있다.
 *
 *   1. 교안 마크다운 표      (사람이 읽는 것)
 *   2. `grammars.ts`         (시뮬레이터가 쓰는 것)
 *   3. `precedence.ts`       (우선 관계 시뮬레이터)
 *   4. `examples/*.c` 배열   (실행되는 것)
 *
 * 하나를 고치고 나머지를 잊으면 **교안이 거짓말을 하게 된다.**
 * 링크 검사도 타입 검사도 이것은 잡지 못하므로 여기서 대조한다.
 */

import {expect, test, describe} from 'bun:test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {exprSLRTable, exprLLTable} from './grammars';
import {opPrecTable, type Rel} from './precedence';

const ROOT = join(import.meta.dir, '..', '..', '..');
const DOCS = join(ROOT, 'docs');
const EXAMPLES = join(ROOT, '..', 'examples');

const read = (p: string) => readFileSync(p, 'utf8');

/** 마크다운 표에서 헤더 이후의 행을 셀 배열로 뽑는다 */
function tableRows(md: string, afterMarker: string): string[][] {
  const start = md.indexOf(afterMarker);
  expect(start, `표를 찾지 못했다: ${afterMarker}`).toBeGreaterThan(-1);
  const lines = md.slice(start).split('\n');
  const rows: string[][] = [];
  let seenSeparator = false;
  for (const line of lines) {
    const t = line.trim();
    if (!t.startsWith('|')) {
      if (rows.length) break;
      continue;
    }
    if (/^\|[\s:|-]+\|$/.test(t)) { seenSeparator = true; continue; }
    if (!seenSeparator) continue;                        // 헤더 행
    rows.push(t.slice(1, -1).split('|').map((c) => c.trim()));
  }
  return rows;
}

/** `**\`+\`**` → `+`, `$E$` → `E` 처럼 장식을 벗긴다.
 *  `$` 자체가 셀 내용일 수 있으므로 수식 구분자만 골라 벗긴다. */
const clean = (s: string) =>
  s
    .trim()
    .replace(/^\*\*([\s\S]*)\*\*$/, '$1')   // 굵게
    .trim()
    .replace(/^`([\s\S]*)`$/, '$1')          // 코드 스팬
    .trim()
    .replace(/^\$([\s\S]+)\$$/, '$1')        // 수식 구분자
    .trim();

describe('SLR(1) 표 — 교안 15장 vs grammars.ts', () => {
  const md = read(join(DOCS, 'parsing/lr-parsing.mdx'));
  const rows = tableRows(md, '### 완성된 표');
  const TERMS = ['id', '+', '*', '(', ')', '$'];
  const NONTERMS = ['E', 'T', 'F'];

  test('12개 상태가 모두 적혀 있다', () => {
    expect(rows.length).toBe(12);
    expect(rows.map((r) => clean(r[0]))).toEqual(
      Array.from({length: 12}, (_, i) => String(i)),
    );
  });

  test('ACTION 칸이 컴포넌트의 표와 한 칸씩 같다', () => {
    rows.forEach((row, state) => {
      TERMS.forEach((term, i) => {
        const cell = clean(row[1 + i]);
        const actual = exprSLRTable.action[state]?.[term];

        if (cell === '') {
          expect(actual, `상태 ${state}, ${term} 열: 교안은 비었는데 코드에는 있다`)
            .toBeUndefined();
          return;
        }
        if (cell === 'acc') {
          expect(actual, `상태 ${state}, ${term} 열`).toEqual({t: 'accept'});
          return;
        }
        const m = cell.match(/^([sr])(\d+)$/);
        expect(m, `상태 ${state}, ${term} 열의 표기가 이상하다: ${cell}`).not.toBeNull();
        const [, kind, num] = m!;
        expect(actual, `상태 ${state}, ${term} 열`).toEqual(
          kind === 's'
            ? {t: 'shift', to: Number(num)}
            : {t: 'reduce', prod: Number(num)},
        );
      });
    });
  });

  test('GOTO 칸이 컴포넌트의 표와 같다', () => {
    rows.forEach((row, state) => {
      // 열 구성: 상태 | 터미널 6 | (구분용 빈 열) | E | T | F
      NONTERMS.forEach((nt, i) => {
        const cell = clean(row[8 + i] ?? '');
        const actual = exprSLRTable.goto[state]?.[nt];
        if (cell === '') {
          expect(actual, `상태 ${state}, ${nt} 열: 교안은 비었는데 코드에는 있다`)
            .toBeUndefined();
        } else {
          expect(actual, `상태 ${state}, ${nt} 열`).toBe(Number(cell));
        }
      });
    });
  });
});

describe('LL(1) 표 — 교안 13장 vs grammars.ts', () => {
  const md = read(join(DOCS, 'parsing/ll-parsing.mdx'));
  const rows = tableRows(md, '이로부터 표를 채운다.');
  const TERMS = ['id', '+', '*', '(', ')', '$'];

  test('다섯 넌터미널의 행이 있다', () => {
    expect(rows.map((r) => clean(r[0]))).toEqual(['E', "E'", 'T', "T'", 'F']);
  });

  test('채워진 칸과 빈 칸이 컴포넌트의 표와 일치한다', () => {
    rows.forEach((row) => {
      const nt = clean(row[0]);
      TERMS.forEach((term, i) => {
        const filled = clean(row[1 + i]) !== '';
        const actual = exprLLTable[nt]?.[term];
        expect(filled, `${nt} 행 ${term} 열`).toBe(actual !== undefined);
      });
    });
  });

  test('LL(1) 이므로 한 칸에 규칙이 하나뿐이다', () => {
    rows.forEach((row) => {
      TERMS.forEach((_, i) => {
        const cell = clean(row[1 + i]);
        if (cell) expect(cell.split(',').length, `여러 규칙이 든 칸: ${cell}`).toBe(1);
      });
    });
  });
});

describe('우선 관계 표 — 교안 14장 vs precedence.ts', () => {
  const md = read(join(DOCS, 'parsing/operator-precedence.mdx'));
  const rows = tableRows(md, '**완성된 우선 관계 표**');
  const ORDER = ['+', '*', '(', ')', 'id', '$'];
  const SYM: Record<string, Rel> = {'⋖': 'lt', '≐': 'eq', '⋗': 'gt'};

  test('6 × 6 표다', () => {
    expect(rows.length).toBe(6);
    expect(rows.map((r) => clean(r[0]))).toEqual(ORDER);
  });

  test('36칸이 모두 precedence.ts 와 같다', () => {
    rows.forEach((row) => {
      const a = clean(row[0]);
      ORDER.forEach((b, i) => {
        const cell = clean(row[1 + i]);
        const actual = opPrecTable[a]?.[b];
        if (cell === '') {
          expect(actual, `${a} 행 ${b} 열: 교안은 빈 칸(오류)인데 코드에는 관계가 있다`)
            .toBeUndefined();
        } else {
          expect(actual, `${a} 행 ${b} 열`).toBe(SYM[cell]);
        }
      });
    });
  });
});

describe('실행되는 C 배열 — examples vs 컴포넌트', () => {
  test('06-lr-table-driven 의 ACTION 배열이 SLR 표와 같다', () => {
    const c = read(join(EXAMPLES, '06-lr-table-driven/lrparse.c'));
    // { S(5), E,    E,    S(4), E,    E    },  형태의 행 12개
    const body = c.slice(c.indexOf('ACTION['));
    const rows = [...body.matchAll(/\{\s*((?:[^{}]|\([^)]*\))*?)\s*\}\s*,/g)]
      .map((m) => m[1].split(',').map((s) => s.trim()))
      .filter((r) => r.length === 6)
      .slice(0, 12);

    expect(rows.length, 'ACTION 배열에서 12행을 찾지 못했다').toBe(12);
    const TERMS = ['id', '+', '*', '(', ')', '$'];

    rows.forEach((row, state) => {
      row.forEach((cell, i) => {
        const term = TERMS[i];
        const actual = exprSLRTable.action[state]?.[term];
        const m = cell.match(/^([SR])\((\d+)\)$/);
        if (cell === 'E' || cell === 'ERR') {
          expect(actual, `C: 상태 ${state}, ${term}`).toBeUndefined();
        } else if (cell === 'ACC' || cell === 'A') {
          expect(actual, `C: 상태 ${state}, ${term}`).toEqual({t: 'accept'});
        } else if (m) {
          expect(actual, `C: 상태 ${state}, ${term}`).toEqual(
            m[1] === 'S'
              ? {t: 'shift', to: Number(m[2])}
              : {t: 'reduce', prod: Number(m[2])},
          );
        }
      });
    });
  });

  test('10-operator-precedence 의 PREC 배열이 우선 관계 표와 같다', () => {
    const c = read(join(EXAMPLES, '10-operator-precedence/opprec.c'));
    const body = c.slice(c.indexOf('PREC[NTERM][NTERM]'));
    const rows = [...body.matchAll(/\{\s*([A-Z, ]+?)\s*\}\s*,/g)]
      .map((m) => m[1].split(',').map((s) => s.trim()).filter(Boolean))
      .filter((r) => r.length === 6)
      .slice(0, 6);

    expect(rows.length, 'PREC 배열에서 6행을 찾지 못했다').toBe(6);
    // C 쪽 순서는 num, +, *, (, ), $
    const C_ORDER = ['id', '+', '*', '(', ')', '$'];
    const MAP: Record<string, Rel | null> = {LT: 'lt', EQ: 'eq', GT: 'gt', NONE: null};

    rows.forEach((row, ri) => {
      const a = C_ORDER[ri];
      row.forEach((cell, ci) => {
        const b = C_ORDER[ci];
        const expected = MAP[cell];
        const actual = opPrecTable[a]?.[b];
        if (expected === null) {
          expect(actual, `C: ${a} 행 ${b} 열`).toBeUndefined();
        } else {
          expect(actual, `C: ${a} 행 ${b} 열`).toBe(expected);
        }
      });
    });
  });
});
