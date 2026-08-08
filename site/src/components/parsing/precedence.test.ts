/**
 * 교안 14장의 우선 관계 표와 추적표가 실제로 맞는지 검증한다.
 *
 * 표의 한 칸이 틀리면 파스 트리가 달라지므로,
 * 눈으로 확인하는 것으로는 부족하다.
 */

import {expect, test, describe} from 'bun:test';
import {
  simulateOperatorPrecedence,
  opGrammar,
  opPrecTable,
  opGrammarWithPow,
  opPrecTableWithPow,
  type PrecStep,
} from './precedence';

const run = (src: string, g = opGrammar, t = opPrecTable) =>
  simulateOperatorPrecedence(g, t, src.trim().split(/\s+/).filter(Boolean));

const last = (steps: PrecStep[]) => steps[steps.length - 1];
const reductions = (steps: PrecStep[]) =>
  steps.filter((s) => s.kind === 'reduce').map((s) => s.handle);

describe('연산자 우선순위 — 수락', () => {
  const ok = [
    'id',
    'id + id',
    'id * id',
    'id + id * id',
    'id * id + id',
    '( id )',
    '( id + id ) * id',
    'id * ( id + id )',
    'id + id + id',
    'id * id * id',
    '( ( id ) )',
    '( id + id ) * ( id + id )',
  ];
  for (const s of ok) {
    test(`수락: ${s}`, () => {
      expect(last(run(s)).kind).toBe('accept');
    });
  }
});

describe('연산자 우선순위 — 거부', () => {
  const bad = [
    'id id',       // 피연산자 둘이 붙었다 (id 행 id 열이 빈 칸)
    '+ id',        // $ 행 + 열이 빈 칸
    'id +',        // + ⋗ $ 인데 걷어 낼 핸들이 E + 뿐
    '( id',        // ( 가 닫히지 않았다
    'id )',        // 여는 괄호가 없다
    ') id',
    'id * * id',
  ];
  for (const s of bad) {
    test(`거부: ${s}`, () => {
      expect(last(run(s)).kind).toBe('error');
    });
  }
});

test('교안 14.3절의 추적표와 한 줄씩 같다', () => {
  const steps = run('id + id * id');

  // 교안의 표 — (스택, 입력, 관계, 동작 종류)
  const expected = [
    ['$', '$ ⋖ id', 'shift'],
    ['$ id', 'id ⋗ +', 'reduce'],
    ['$ E', '$ ⋖ +', 'shift'],
    ['$ E +', '+ ⋖ id', 'shift'],
    ['$ E + id', 'id ⋗ *', 'reduce'],
    ['$ E + E', '+ ⋖ *', 'shift'],
    ['$ E + E *', '* ⋖ id', 'shift'],
    ['$ E + E * id', 'id ⋗ $', 'reduce'],
    ['$ E + E * E', '* ⋗ $', 'reduce'],
    ['$ E + E', '+ ⋗ $', 'reduce'],
    ['$ E', '—', 'accept'],
  ];

  expect(steps.map((s) => [s.stack, s.relation, s.kind])).toEqual(expected);
});

test('6행이 핵심 — 스택이 $ E + E 이고 입력이 * 면 이동한다', () => {
  const steps = run('id + id * id');
  const row = steps.find((s) => s.stack === '$ E + E' && s.input.startsWith('*'));
  expect(row?.kind).toBe('shift');
  expect(row?.relation).toBe('+ ⋖ *');
});

test('* 가 + 보다 먼저 묶인다 — 핸들 순서로 확인', () => {
  // id + id * id → id, id, id, (E*E), (E+E) 순으로 축약되어야 한다
  expect(reductions(run('id + id * id'))).toEqual([
    'id',
    'id',
    'id',
    'E * E',
    'E + E',
  ]);
});

test('+ 가 먼저 나오면 좌결합으로 왼쪽부터 묶인다', () => {
  // id + id + id → 첫 + 가 먼저 축약된다
  const r = reductions(run('id + id + id'));
  expect(r).toEqual(['id', 'id', 'E + E', 'id', 'E + E']);
});

test('괄호는 ≐ 로 한 핸들이 된다', () => {
  expect(reductions(run('( id )'))).toEqual(['id', '( E )']);
});

test('괄호가 우선순위를 뒤집는다', () => {
  // ( id + id ) * id → + 가 * 보다 먼저 축약된다
  const r = reductions(run('( id + id ) * id'));
  expect(r.indexOf('E + E')).toBeLessThan(r.indexOf('E * E'));
});

describe('우결합 연산자', () => {
  const pow = (s: string) => run(s, opGrammarWithPow, opPrecTableWithPow);

  test('^ 는 우결합이라 오른쪽부터 묶인다', () => {
    // id ^ id ^ id → 오른쪽 ^ 가 먼저 축약된다.
    // 좌결합이라면 세 번째 축약이 E ^ E 여야 하는데, 우결합이면
    // id 세 개를 모두 쌓은 뒤에야 축약이 시작된다.
    const steps = pow('id ^ id ^ id');
    const kinds = steps.map((s) => s.kind);
    // 마지막 id 를 이동하기 전에 E ^ E 축약이 없어야 한다
    const firstPow = steps.findIndex((s) => s.handle === 'E ^ E');
    const lastShift = kinds.lastIndexOf('shift');
    expect(firstPow).toBeGreaterThan(lastShift);
    expect(last(steps).kind).toBe('accept');
  });

  test('^ 가 * 보다 세다', () => {
    const r = reductions(pow('id * id ^ id'));
    expect(r.indexOf('E ^ E')).toBeLessThan(r.indexOf('E * E'));
  });

  test('좌결합 + 는 여전히 왼쪽부터', () => {
    expect(last(pow('id + id + id')).kind).toBe('accept');
  });
});

test('빈 입력은 거부된다 (연산자 문법에는 ε 규칙이 없다)', () => {
  expect(last(run('')).kind).toBe('error');
});
