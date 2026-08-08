/**
 * 17장 속성 평가 — 교안의 주장을 검증한다.
 *
 * 검증하는 주장은 셋이다.
 *   1. 합성 속성만 쓰면 후위 순회 한 번으로 계산이 끝난다
 *   2. 상속 속성이 끼면 후위 순회로는 안 된다
 *   3. 위상 정렬 순서는 언제나 의존 관계를 지킨다
 */

import {expect, test, describe} from 'bun:test';
import {
  calcScenario,
  declScenario,
  postorder,
  postorderWorks,
  topologicalOrder,
  type AttrScenario,
} from './attributes';

/** 나온 순서가 모든 의존을 지키는지 확인한다 */
function respectsDeps(sc: AttrScenario, order: string[]): boolean {
  const pos = new Map(order.map((id, i) => [id, i]));
  return sc.attrs.every((a) =>
    a.deps.every((d) => (pos.get(d) ?? -1) < (pos.get(a.id) ?? -1)),
  );
}

describe('시나리오 ① 계산기 — 합성 속성만', () => {
  test('모든 속성이 합성 속성이다', () => {
    expect(calcScenario.attrs.every((a) => a.kind === 'syn')).toBe(true);
  });

  test('후위 순회 한 번으로 계산된다', () => {
    expect(postorderWorks(calcScenario)).toBe(true);
  });

  test('위상 정렬이 존재하고 의존을 지킨다', () => {
    const order = topologicalOrder(calcScenario);
    expect(order).not.toBeNull();
    expect(respectsDeps(calcScenario, order!)).toBe(true);
  });

  test('루트가 마지막에 계산된다 — 값이 위로 올라간다', () => {
    const order = topologicalOrder(calcScenario)!;
    expect(order[order.length - 1]).toBe('E0.val');
  });

  test('위상 정렬 순서가 후위 순회 노드 순서와 어긋나지 않는다', () => {
    const nodeRank = new Map(postorder(calcScenario).map((id, i) => [id, i]));
    const byId = new Map(calcScenario.attrs.map((a) => [a.id, a]));
    const ranks = topologicalOrder(calcScenario)!.map(
      (id) => nodeRank.get(byId.get(id)!.node)!,
    );
    // 합성 속성만이면 노드 순위가 단조 증가해야 한다
    expect(ranks).toEqual([...ranks].sort((x, y) => x - y));
  });

  test('결과는 19 다 — 3 * 5 + 4', () => {
    expect(calcScenario.attrs.find((a) => a.id === 'E0.val')?.value).toBe('19');
  });

  test('* 가 + 보다 먼저 계산된다', () => {
    const order = topologicalOrder(calcScenario)!;
    expect(order.indexOf('T1.val')).toBeLessThan(order.indexOf('E0.val'));
  });
});

describe('시나리오 ② 선언 — 상속 속성', () => {
  test('상속 속성이 있다', () => {
    expect(declScenario.attrs.some((a) => a.kind === 'inh')).toBe(true);
  });

  test('후위 순회로는 계산되지 않는다', () => {
    expect(postorderWorks(declScenario)).toBe(false);
  });

  test('그래도 위상 정렬은 존재한다 — L-속성이라 사이클이 없다', () => {
    const order = topologicalOrder(declScenario);
    expect(order).not.toBeNull();
    expect(respectsDeps(declScenario, order!)).toBe(true);
  });

  test('타입이 위에서 아래로 흐른다 — T.type 이 가장 먼저', () => {
    const order = topologicalOrder(declScenario)!;
    expect(order[0]).toBe('T.type');
    expect(order.indexOf('L0.in')).toBeLessThan(order.indexOf('L1.in'));
    expect(order.indexOf('L1.in')).toBeLessThan(order.indexOf('L2.in'));
  });

  test('가장 왼쪽 id(a) 의 addtype 이 트리에서는 가장 깊은데 값은 맨 위에서 온다', () => {
    const order = topologicalOrder(declScenario)!;
    // a 에 타입을 달려면 L0 → L1 → L2 로 세 번 내려와야 한다
    expect(order.indexOf('L2.act')).toBeGreaterThan(order.indexOf('L0.in'));
    // 후위 순회라면 L2 가 L0 보다 먼저인데, 값은 L0 에서 와야 한다.
    // 이 역전이 yacc 에서 중간 액션이 필요해지는 이유다.
    const po = postorder(declScenario);
    expect(po.indexOf('L2')).toBeLessThan(po.indexOf('L0'));
  });

  test('세 변수 모두 integer 로 등록된다', () => {
    const acts = declScenario.attrs.filter((a) => a.kind === 'act');
    expect(acts.map((a) => a.value)).toEqual(['a : integer', 'b : integer', 'c : integer']);
  });
});

test('사이클이 있으면 위상 정렬이 없다', () => {
  const bad: AttrScenario = {
    key: 'cycle',
    title: '순환 SDD',
    input: '',
    nodes: [{id: 'A', label: 'A', children: []}],
    attrs: [
      {id: 'A.x', node: 'A', name: 'x', kind: 'syn', deps: ['A.y'], rule: 'A.x := A.y', value: '?'},
      {id: 'A.y', node: 'A', name: 'y', kind: 'syn', deps: ['A.x'], rule: 'A.y := A.x', value: '?'},
    ],
  };
  expect(topologicalOrder(bad)).toBeNull();
});
