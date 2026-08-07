/**
 * LL(1)·LR 파싱 알고리즘 본체.
 *
 * React 와 무관한 순수 함수로 분리해 두었다.
 * 덕분에 `bun test` 로 파싱 표의 정확성을 직접 검증할 수 있다
 * (`simulate.test.ts` 참고). 교안에 싣는 파싱 표가 실제로 맞는지
 * 눈으로만 확인하고 싶지는 않았다.
 */

import type {Grammar, LLTable, LRTable, Step} from './types';
import {EOI, showProduction} from './types';

/** 무한 루프 방어 — 문법이나 표가 잘못되었을 때를 대비한다 */
const MAX_STEPS = 400;

/* ══ LL(1) ═════════════════════════════════════════════════
 *
 * 스택 맨 위 X, 현재 입력 a 에 대해
 *   X 가 터미널  →  X == a 인지 확인하고 둘 다 소비 (match)
 *   X 가 넌터미널 →  M[X, a] 우변을 **역순으로** 밀어 넣는다 (expand)
 *
 * 스택 배열은 끝이 맨 위다.
 */
export function simulateLL(
  g: Grammar,
  table: LLTable,
  tokens: readonly string[],
): Step[] {
  const steps: Step[] = [];
  const stack: string[] = [EOI, g.start];
  const input = [...tokens, EOI];
  let ip = 0;

  const snap = () => ({stack: stack.join(' '), input: input.slice(ip).join(' ')});

  for (let guard = 0; guard < MAX_STEPS; guard++) {
    const X = stack[stack.length - 1];
    const a = input[ip];

    if (X === EOI && a === EOI) {
      steps.push({...snap(), action: '수락', kind: 'accept'});
      return steps;
    }

    const isTerminal = X === EOI || !g.nonterminals.includes(X);

    if (isTerminal) {
      if (X === a) {
        steps.push({...snap(), action: `매치 ${a}`, kind: 'match'});
        stack.pop();
        ip++;
      } else {
        steps.push({
          ...snap(),
          action: `오류 — 스택의 ${X} 와 입력 ${a} 가 다르다`,
          kind: 'error',
        });
        return steps;
      }
      continue;
    }

    const prod = table[X]?.[a];
    if (prod === undefined) {
      steps.push({
        ...snap(),
        action: `오류 — M[${X}, ${a}] 가 비어 있다`,
        kind: 'error',
      });
      return steps;
    }

    const p = g.productions[prod];
    steps.push({
      ...snap(),
      action: `출력 ${showProduction(p)}`,
      prod,
      kind: 'expand',
    });
    stack.pop();
    for (let i = p.rhs.length - 1; i >= 0; i--) stack.push(p.rhs[i]);
  }

  steps.push({
    ...snap(),
    action: '중단 — 단계 수 상한 초과 (좌재귀나 순환이 있는가?)',
    kind: 'error',
  });
  return steps;
}

/* ══ LR ════════════════════════════════════════════════════
 *
 * 스택에는 상태와 문법 심볼이 번갈아 쌓인다: 0 E 1 + 6 T 9
 *
 *   shift s   →  입력 기호와 상태 s 를 밀어 넣고 입력을 하나 전진
 *   reduce p  →  p 의 우변 길이만큼 걷어 내고
 *                GOTO[걷어 낸 뒤 맨 위 상태][p 의 좌변] 로 이동
 *   accept    →  성공
 */
type Cell = {state: number; sym?: string};

export function simulateLR(
  g: Grammar,
  table: LRTable,
  tokens: readonly string[],
): Step[] {
  const steps: Step[] = [];
  const stack: Cell[] = [{state: 0}];
  const input = [...tokens, EOI];
  let ip = 0;

  const snap = () => ({
    stack: stack.map((c) => (c.sym ? `${c.sym} ${c.state}` : `${c.state}`)).join(' '),
    input: input.slice(ip).join(' '),
  });

  for (let guard = 0; guard < MAX_STEPS; guard++) {
    const s = stack[stack.length - 1].state;
    const a = input[ip];
    const act = table.action[s]?.[a];

    if (!act) {
      const expected = Object.keys(table.action[s] ?? {});
      steps.push({
        ...snap(),
        action:
          `오류 — ACTION[${s}, ${a}] 가 비어 있다` +
          (expected.length ? ` (기대: ${expected.join(', ')})` : ''),
        kind: 'error',
      });
      return steps;
    }

    if (act.t === 'accept') {
      steps.push({...snap(), action: '수락', kind: 'accept'});
      return steps;
    }

    if (act.t === 'shift') {
      steps.push({...snap(), action: `이동 s${act.to}`, kind: 'shift'});
      stack.push({sym: a, state: act.to});
      ip++;
      continue;
    }

    const p = g.productions[act.prod];
    steps.push({
      ...snap(),
      action: `축약 r${act.prod} : ${showProduction(p)}`,
      prod: act.prod,
      kind: 'reduce',
    });
    for (let i = 0; i < p.rhs.length; i++) stack.pop();
    const top = stack[stack.length - 1].state;
    const go = table.goto[top]?.[p.lhs];
    if (go === undefined) {
      steps.push({
        ...snap(),
        action: `오류 — GOTO[${top}, ${p.lhs}] 가 비어 있다`,
        kind: 'error',
      });
      return steps;
    }
    stack.push({sym: p.lhs, state: go});
  }

  steps.push({...snap(), action: '중단 — 단계 수 상한 초과', kind: 'error'});
  return steps;
}

/** 파싱이 성공했는지 간단히 확인하는 헬퍼 */
export function accepts(steps: readonly Step[]): boolean {
  return steps[steps.length - 1]?.kind === 'accept';
}
