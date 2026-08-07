/**
 * 교안에 싣는 파싱 표가 실제로 맞는지 검증한다.
 *
 *   bun test
 *
 * 표를 손으로 옮겨 적다 보면 한두 칸을 틀리기 쉬운데,
 * 그런 표로 만든 추적표를 교재에 실으면 학습자가 며칠을 헤맬 수 있다.
 * 그래서 "이 표로 이 입력이 수락된다"를 기계로 확인한다.
 */

import {describe, expect, test} from 'bun:test';
import {
  exprGrammarLL,
  exprGrammarLR,
  exprLLTable,
  exprSLRTable,
} from './grammars';
import {accepts, simulateLL, simulateLR} from './simulate';

const tok = (s: string) => s.split(/\s+/).filter(Boolean);

const VALID = [
  'id',
  'id + id',
  'id * id',
  'id + id * id',
  'id * id + id',
  '( id )',
  '( id + id ) * id',
  'id + ( id * id )',
  '( ( id ) )',
  'id + id + id',
  'id * id * id',
  '( id + id ) * ( id + id )',
];

const INVALID = [
  '+ id',
  'id +',
  'id id',
  '( id',
  'id )',
  '* id',
  '( )',
  'id + * id',
];

describe('SLR(1) 파싱 표 (Dragon Book 그림 4.37)', () => {
  test.each(VALID)('수락: %s', (s) => {
    expect(accepts(simulateLR(exprGrammarLR, exprSLRTable, tok(s)))).toBe(true);
  });

  test.each(INVALID)('거부: %s', (s) => {
    expect(accepts(simulateLR(exprGrammarLR, exprSLRTable, tok(s)))).toBe(false);
  });

  test('id + id * id 는 교과서와 같은 축약 순서를 낸다', () => {
    const steps = simulateLR(exprGrammarLR, exprSLRTable, tok('id + id * id'));
    const reductions = steps
      .filter((s) => s.kind === 'reduce')
      .map((s) => s.prod);
    // F→id, T→F, E→T, F→id, T→F, F→id, T→T*F, E→E+T
    expect(reductions).toEqual([6, 4, 2, 6, 4, 6, 3, 1]);
  });

  test('곱셈이 덧셈보다 먼저 축약된다 (우선순위가 표에 새겨져 있다)', () => {
    const steps = simulateLR(exprGrammarLR, exprSLRTable, tok('id + id * id'));
    const reductions = steps
      .filter((s) => s.kind === 'reduce')
      .map((s) => s.prod!);
    const mul = reductions.indexOf(3); // T → T * F
    const add = reductions.indexOf(1); // E → E + T
    expect(mul).toBeGreaterThanOrEqual(0);
    expect(add).toBeGreaterThan(mul);
  });
});

describe('LL(1) 예측 파싱 표', () => {
  test.each(VALID)('수락: %s', (s) => {
    expect(accepts(simulateLL(exprGrammarLL, exprLLTable, tok(s)))).toBe(true);
  });

  test.each(INVALID)('거부: %s', (s) => {
    expect(accepts(simulateLL(exprGrammarLL, exprLLTable, tok(s)))).toBe(false);
  });

  test('LL 과 LR 이 같은 언어를 인정한다', () => {
    for (const s of [...VALID, ...INVALID]) {
      const ll = accepts(simulateLL(exprGrammarLL, exprLLTable, tok(s)));
      const lr = accepts(simulateLR(exprGrammarLR, exprSLRTable, tok(s)));
      expect({input: s, ll}).toEqual({input: s, ll: lr});
    }
  });

  test('첫 확장은 항상 E → T E′ 이다', () => {
    const steps = simulateLL(exprGrammarLL, exprLLTable, tok('id + id'));
    expect(steps[0].prod).toBe(0);
  });
});
