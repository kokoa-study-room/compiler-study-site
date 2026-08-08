/**
 * 연산자 우선순위 파싱 (14장).
 *
 * LL/LR 과 마찬가지로 알고리즘 본체를 React 밖에 두어
 * `bun test` 로 교안의 우선 관계 표와 추적표를 직접 검증한다.
 *
 * LR 과의 차이가 하나 있다. LR 은 상태 번호로 "지금 어디까지 왔는지"를
 * 기억하지만, 연산자 우선순위 파싱은 **스택 맨 위 터미널과 다음 입력**
 * 두 개만 본다. 상태가 없다. 그래서 표가 작고 알고리즘이 짧다.
 */

import type {Production} from './types';
import {EOI} from './types';

/** 우선 관계 — ⋖ (양보) / ≐ (같은 핸들) / ⋗ (이김) */
export type Rel = 'lt' | 'eq' | 'gt';

export const REL_SYMBOL: Record<Rel, string> = {
  lt: '⋖',
  eq: '≐',
  gt: '⋗',
};

/** PREC[왼쪽 터미널][오른쪽 터미널] — 없으면 구문 오류 */
export type PrecTable = Record<string, Record<string, Rel>>;

export type PrecStep = {
  /** 스택 전체 (왼쪽이 바닥) */
  stack: string;
  /** 남은 입력 */
  input: string;
  /** 이번에 비교한 두 터미널과 관계. 수락·오류면 '—' */
  relation: string;
  action: string;
  /** 축약이라면 걷어 낸 핸들 */
  handle?: string;
  kind: 'shift' | 'reduce' | 'accept' | 'error';
};

const MAX_STEPS = 300;

export type PrecGrammar = {
  /** 스택에 쌓이는 넌터미널 이름. 이 기법은 넌터미널을 구별하지 않는다 */
  nonterminal: string;
  /** 핸들을 무엇으로 축약할지 찾을 때 쓴다 */
  productions: readonly Production[];
  terminals: readonly string[];
};

/**
 * 연산자 우선순위 파싱을 한 걸음씩 기록한다.
 *
 * 교안 14.3절의 추적표와 같은 결과가 나온다.
 */
export function simulateOperatorPrecedence(
  g: PrecGrammar,
  table: PrecTable,
  tokens: readonly string[],
): PrecStep[] {
  const steps: PrecStep[] = [];
  const stack: string[] = [EOI];
  const input = [...tokens, EOI];
  let ip = 0;

  const isTerminal = (s: string) => s === EOI || g.terminals.includes(s);
  const snap = () => ({
    stack: stack.join(' '),
    input: input.slice(ip).join(' '),
  });

  /** 스택에서 넌터미널을 건너뛰고 가장 위의 터미널을 찾는다 */
  const topTerminalIndex = () => {
    for (let i = stack.length - 1; i >= 0; i--) if (isTerminal(stack[i])) return i;
    return -1;
  };

  for (let guard = 0; guard < MAX_STEPS; guard++) {
    const ti = topTerminalIndex();
    const a = stack[ti];
    const b = input[ip];

    if (a === EOI && b === EOI) {
      /* 스택이 `$ E` 여야 진짜 수락이다.
       * 빈 입력이면 스택이 `$` 뿐이므로 여기서 걸러진다 —
       * 연산자 문법에는 ε 규칙이 없다는 조건이 이렇게 드러난다. */
      const ok = stack.length === 2 && stack[1] === g.nonterminal;
      steps.push(
        ok
          ? {...snap(), relation: '—', action: '수락', kind: 'accept'}
          : {
              ...snap(),
              relation: '—',
              action: '구문 오류 — 입력이 완결된 식이 아니다',
              kind: 'error',
            },
      );
      return steps;
    }

    const rel = table[a]?.[b];
    if (rel === undefined) {
      steps.push({
        ...snap(),
        relation: `${a} ? ${b}`,
        action: `구문 오류 — ${a} 와 ${b} 사이에 관계가 없다`,
        kind: 'error',
      });
      return steps;
    }

    const relText = `${a} ${REL_SYMBOL[rel]} ${b}`;

    if (rel === 'lt' || rel === 'eq') {
      steps.push({...snap(), relation: relText, action: `이동 ${b}`, kind: 'shift'});
      stack.push(b);
      ip++;
      continue;
    }

    /* rel === 'gt' — 핸들을 걷어 낸다.
     *
     * 핸들의 오른쪽 끝은 스택 맨 위 터미널이다.
     * 왼쪽 끝은 ≐ 로 이어진 구간을 지나 ⋖ 를 만나는 자리다.
     * 마지막으로 바로 앞에 넌터미널이 있으면 그것까지가 핸들이다
     * (E * E 처럼 양쪽에 피연산자가 붙는 경우). */
    const termIdx: number[] = [];
    stack.forEach((s, i) => {
      if (isTerminal(s)) termIdx.push(i);
    });

    let j = termIdx.length - 1;
    while (j > 0 && table[stack[termIdx[j - 1]]]?.[stack[termIdx[j]]] === 'eq') j--;

    if (j === 0) {
      steps.push({
        ...snap(),
        relation: relText,
        action: '구문 오류 — 걷어 낼 핸들이 없다',
        kind: 'error',
      });
      return steps;
    }

    let start = termIdx[j];
    if (start > 0 && !isTerminal(stack[start - 1])) start--;

    const handle = stack.slice(start);
    const prod = g.productions.find(
      (p) => p.rhs.length === handle.length && p.rhs.every((s, k) => s === handle[k]),
    );

    if (!prod) {
      steps.push({
        ...snap(),
        relation: relText,
        action: `구문 오류 — ${handle.join(' ')} 에 맞는 규칙이 없다`,
        handle: handle.join(' '),
        kind: 'error',
      });
      return steps;
    }

    steps.push({
      ...snap(),
      relation: relText,
      action: `축약 ${prod.lhs} → ${prod.rhs.join(' ')}`,
      handle: handle.join(' '),
      kind: 'reduce',
    });
    stack.length = start;
    stack.push(g.nonterminal);
  }

  steps.push({
    stack: stack.join(' '),
    input: input.slice(ip).join(' '),
    relation: '—',
    action: `${MAX_STEPS} 단계를 넘겼다 — 표가 잘못되었을 수 있다`,
    kind: 'error',
  });
  return steps;
}

/* ══ 교안 14장의 문법과 표 ═══════════════════════════════════
 *
 *   E → E + E | E * E | ( E ) | id
 *
 * 모호한 문법이다. 우선 관계 표가 모호성을 대신 해결한다 —
 * yacc 의 %left 선언이 하는 일과 같다.
 */

export const opGrammar: PrecGrammar = {
  nonterminal: 'E',
  terminals: ['+', '*', '(', ')', 'id'],
  productions: [
    {lhs: 'E', rhs: ['E', '+', 'E']},
    {lhs: 'E', rhs: ['E', '*', 'E']},
    {lhs: 'E', rhs: ['(', 'E', ')']},
    {lhs: 'E', rhs: ['id']},
  ],
};

/** 교안 14.2절의 우선 관계 표. 빈 칸(undefined)은 구문 오류다. */
export const opPrecTable: PrecTable = {
  '+': {'+': 'gt', '*': 'lt', '(': 'lt', ')': 'gt', id: 'lt', $: 'gt'},
  '*': {'+': 'gt', '*': 'gt', '(': 'lt', ')': 'gt', id: 'lt', $: 'gt'},
  '(': {'+': 'lt', '*': 'lt', '(': 'lt', ')': 'eq', id: 'lt'},
  ')': {'+': 'gt', '*': 'gt', ')': 'gt', $: 'gt'},
  id: {'+': 'gt', '*': 'gt', ')': 'gt', $: 'gt'},
  $: {'+': 'lt', '*': 'lt', '(': 'lt', id: 'lt'},
};

/** `^` 를 우결합으로 넣은 표 — 같은 칸이 ⋗ 에서 ⋖ 로 바뀐다 */
export const opPrecTableWithPow: PrecTable = {
  '+': {'+': 'gt', '*': 'lt', '^': 'lt', '(': 'lt', ')': 'gt', id: 'lt', $: 'gt'},
  '*': {'+': 'gt', '*': 'gt', '^': 'lt', '(': 'lt', ')': 'gt', id: 'lt', $: 'gt'},
  '^': {'+': 'gt', '*': 'gt', '^': 'lt', '(': 'lt', ')': 'gt', id: 'lt', $: 'gt'},
  '(': {'+': 'lt', '*': 'lt', '^': 'lt', '(': 'lt', ')': 'eq', id: 'lt'},
  ')': {'+': 'gt', '*': 'gt', '^': 'gt', ')': 'gt', $: 'gt'},
  id: {'+': 'gt', '*': 'gt', '^': 'gt', ')': 'gt', $: 'gt'},
  $: {'+': 'lt', '*': 'lt', '^': 'lt', '(': 'lt', id: 'lt'},
};

export const opGrammarWithPow: PrecGrammar = {
  nonterminal: 'E',
  terminals: ['+', '*', '^', '(', ')', 'id'],
  productions: [
    {lhs: 'E', rhs: ['E', '+', 'E']},
    {lhs: 'E', rhs: ['E', '*', 'E']},
    {lhs: 'E', rhs: ['E', '^', 'E']},
    {lhs: 'E', rhs: ['(', 'E', ')']},
    {lhs: 'E', rhs: ['id']},
  ],
};

/** 표를 화면에 그릴 때 쓰는 열 순서 */
export const opTerminalOrder = ['+', '*', '(', ')', 'id', EOI];
export const opTerminalOrderWithPow = ['+', '*', '^', '(', ')', 'id', EOI];
