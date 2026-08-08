/**
 * 속성 평가 (17장).
 *
 * 주석 달린 파스 트리에서 속성값이 **어떤 순서로** 채워지는지를 다룬다.
 * 순서를 정하는 것은 의존 그래프의 위상 정렬이다.
 *
 * 이 파일의 요점은 두 순서를 나란히 계산해 보는 것이다.
 *
 *   후위 순회 순서 — LR 파서(그리고 yacc)가 액션을 실행하는 순서
 *   위상 정렬 순서 — 의존 그래프가 요구하는 순서
 *
 * 합성 속성만 쓰면 둘이 일치한다. 상속 속성이 끼면 어긋난다.
 * **그 어긋남이 yacc 에서 중간 액션이 필요해지는 이유다.**
 */

export type AttrKind = 'syn' | 'inh' | 'act';

/** 트리 노드 하나 */
export type TreeNode = {
  id: string;
  /** 화면에 보일 심볼 이름 */
  label: string;
  children: string[];
  /** 터미널의 실제 문자열 */
  lexeme?: string;
};

/** 속성 인스턴스 하나 — "이 노드의 이 속성" */
export type AttrInstance = {
  /** `E0.val` 처럼 노드 id + 속성 이름 */
  id: string;
  /** 어느 트리 노드에 붙는가 */
  node: string;
  /** 속성 이름 (act 이면 부수 효과 이름) */
  name: string;
  kind: AttrKind;
  /** 이 값을 계산하려면 먼저 있어야 하는 속성들 */
  deps: string[];
  /** 의미 규칙을 사람이 읽을 수 있게 적은 것 */
  rule: string;
  /** 계산 결과 (표시용) */
  value: string;
};

export type AttrScenario = {
  key: string;
  title: string;
  /** 원본 입력 */
  input: string;
  /** 첫 원소가 루트 */
  nodes: TreeNode[];
  attrs: AttrInstance[];
};

/* ══ 순서 계산 ═════════════════════════════════════════════ */

/** 트리를 후위 순회한 노드 id 열 */
export function postorder(sc: AttrScenario): string[] {
  const byId = new Map(sc.nodes.map((n) => [n.id, n]));
  const out: string[] = [];
  const walk = (id: string) => {
    const n = byId.get(id);
    if (!n) return;
    n.children.forEach(walk);
    out.push(id);
  };
  walk(sc.nodes[0].id);
  return out;
}

/** 노드 id → 그 노드의 조상들(자기 자신 제외) */
function ancestorsOf(sc: AttrScenario): Map<string, Set<string>> {
  const parent = new Map<string, string>();
  sc.nodes.forEach((n) => n.children.forEach((c) => parent.set(c, n.id)));
  const out = new Map<string, Set<string>>();
  for (const n of sc.nodes) {
    const s = new Set<string>();
    let p = parent.get(n.id);
    while (p) {
      s.add(p);
      p = parent.get(p);
    }
    out.set(n.id, s);
  }
  return out;
}

/**
 * 의존 그래프의 위상 정렬.
 *
 * 같은 순위일 때는 **후위 순회 순서**를 먼저 쓴다.
 * 그래야 합성 속성만 있는 경우 결과가 후위 순회와 정확히 같아져서
 * 두 순서를 비교하는 의미가 생긴다.
 *
 * 사이클이 있으면 `null` 을 돌려준다 — 계산할 수 없는 SDD다.
 */
export function topologicalOrder(sc: AttrScenario): string[] | null {
  const nodeRank = new Map(postorder(sc).map((id, i) => [id, i]));
  const attrs = new Map(sc.attrs.map((a) => [a.id, a]));
  const indeg = new Map<string, number>();
  const outEdges = new Map<string, string[]>();

  for (const a of sc.attrs) {
    indeg.set(a.id, 0);
    outEdges.set(a.id, []);
  }
  for (const a of sc.attrs) {
    for (const d of a.deps) {
      if (!attrs.has(d)) continue;
      outEdges.get(d)!.push(a.id);
      indeg.set(a.id, indeg.get(a.id)! + 1);
    }
  }

  const rank = (id: string) => {
    const a = attrs.get(id)!;
    return (nodeRank.get(a.node) ?? 0) * 100 + sc.attrs.indexOf(a) / 1000;
  };

  const ready = sc.attrs.filter((a) => indeg.get(a.id) === 0).map((a) => a.id);
  const out: string[] = [];

  while (ready.length) {
    ready.sort((x, y) => rank(x) - rank(y));
    const cur = ready.shift()!;
    out.push(cur);
    for (const nxt of outEdges.get(cur)!) {
      indeg.set(nxt, indeg.get(nxt)! - 1);
      if (indeg.get(nxt) === 0) ready.push(nxt);
    }
  }

  return out.length === sc.attrs.length ? out : null;
}

/**
 * 후위 순회 한 번으로 전부 계산되는가?
 *
 * 어떤 속성의 의존 대상이 **자기 노드의 후손이 아닌 곳**에 있으면,
 * 그 노드에 도달한 시점에 값이 아직 없을 수 있다.
 * 상속 속성이 정확히 그런 경우다.
 */
export function postorderWorks(sc: AttrScenario): boolean {
  const anc = ancestorsOf(sc);
  const attrs = new Map(sc.attrs.map((a) => [a.id, a]));
  for (const a of sc.attrs) {
    for (const d of a.deps) {
      const dep = attrs.get(d);
      if (!dep) continue;
      // 의존 대상이 같은 노드이거나 후손이면 괜찮다
      if (dep.node === a.node) continue;
      if (anc.get(dep.node)?.has(a.node)) continue;
      return false;
    }
  }
  return true;
}

/* ══ 시나리오 ① 합성 속성만 — 계산기 ═══════════════════════
 *
 *   E → E + T   E.val := E₁.val + T.val
 *   E → T       E.val := T.val
 *   T → T * F   T.val := T₁.val × F.val
 *   T → F       T.val := F.val
 *   F → num     F.val := num.val
 *
 * 입력 3 * 5 + 4. 교안 17.3절의 주석 달린 파스 트리와 같은 트리다.
 */

export const calcScenario: AttrScenario = {
  key: 'calc',
  title: '합성 속성만 — 계산기 `3 * 5 + 4`',
  input: '3 * 5 + 4',
  nodes: [
    {id: 'E0', label: 'E', children: ['E1', 'plus', 'T0']},
    {id: 'E1', label: 'E', children: ['T1']},
    {id: 'plus', label: '+', children: [], lexeme: '+'},
    {id: 'T1', label: 'T', children: ['T2', 'star', 'F1']},
    {id: 'T2', label: 'T', children: ['F2']},
    {id: 'star', label: '*', children: [], lexeme: '*'},
    {id: 'F1', label: 'F', children: ['n2']},
    {id: 'F2', label: 'F', children: ['n1']},
    {id: 'n1', label: 'num', children: [], lexeme: '3'},
    {id: 'n2', label: 'num', children: [], lexeme: '5'},
    {id: 'T0', label: 'T', children: ['F3']},
    {id: 'F3', label: 'F', children: ['n3']},
    {id: 'n3', label: 'num', children: [], lexeme: '4'},
  ],
  attrs: [
    {id: 'n1.val', node: 'n1', name: 'val', kind: 'syn', deps: [], rule: '어휘 분석기가 준다 (yylval)', value: '3'},
    {id: 'n2.val', node: 'n2', name: 'val', kind: 'syn', deps: [], rule: '어휘 분석기가 준다 (yylval)', value: '5'},
    {id: 'n3.val', node: 'n3', name: 'val', kind: 'syn', deps: [], rule: '어휘 분석기가 준다 (yylval)', value: '4'},
    {id: 'F2.val', node: 'F2', name: 'val', kind: 'syn', deps: ['n1.val'], rule: 'F.val := num.val', value: '3'},
    {id: 'T2.val', node: 'T2', name: 'val', kind: 'syn', deps: ['F2.val'], rule: 'T.val := F.val', value: '3'},
    {id: 'F1.val', node: 'F1', name: 'val', kind: 'syn', deps: ['n2.val'], rule: 'F.val := num.val', value: '5'},
    {id: 'T1.val', node: 'T1', name: 'val', kind: 'syn', deps: ['T2.val', 'F1.val'], rule: 'T.val := T₁.val × F.val', value: '15'},
    {id: 'E1.val', node: 'E1', name: 'val', kind: 'syn', deps: ['T1.val'], rule: 'E.val := T.val', value: '15'},
    {id: 'F3.val', node: 'F3', name: 'val', kind: 'syn', deps: ['n3.val'], rule: 'F.val := num.val', value: '4'},
    {id: 'T0.val', node: 'T0', name: 'val', kind: 'syn', deps: ['F3.val'], rule: 'T.val := F.val', value: '4'},
    {id: 'E0.val', node: 'E0', name: 'val', kind: 'syn', deps: ['E1.val', 'T0.val'], rule: 'E.val := E₁.val + T.val', value: '19'},
  ],
};

/* ══ 시나리오 ② 상속 속성 — 선언 ═══════════════════════════
 *
 *   D → T L      L.in := T.type
 *   T → int      T.type := 'int'
 *   L → L₁ , id  L₁.in := L.in ;  addtype(id.entry, L.in)
 *   L → id       addtype(id.entry, L.in)
 *
 * 입력 int a, b, c. 교안 17.2절의 선언 예제와 같다.
 */

export const declScenario: AttrScenario = {
  key: 'decl',
  title: '상속 속성 — 선언 `int a, b, c`',
  input: 'int a, b, c',
  nodes: [
    {id: 'D', label: 'D', children: ['T', 'L0']},
    {id: 'T', label: 'T', children: ['kw']},
    {id: 'kw', label: 'int', children: [], lexeme: 'int'},
    {id: 'L0', label: 'L', children: ['L1', 'c2', 'idc']},
    {id: 'L1', label: 'L', children: ['L2', 'c1', 'idb']},
    {id: 'L2', label: 'L', children: ['ida']},
    {id: 'ida', label: 'id', children: [], lexeme: 'a'},
    {id: 'c1', label: ',', children: [], lexeme: ','},
    {id: 'idb', label: 'id', children: [], lexeme: 'b'},
    {id: 'c2', label: ',', children: [], lexeme: ','},
    {id: 'idc', label: 'id', children: [], lexeme: 'c'},
  ],
  attrs: [
    {id: 'T.type', node: 'T', name: 'type', kind: 'syn', deps: [], rule: 'T.type := integer', value: 'integer'},
    {id: 'L0.in', node: 'L0', name: 'in', kind: 'inh', deps: ['T.type'], rule: 'L.in := T.type', value: 'integer'},
    {id: 'L1.in', node: 'L1', name: 'in', kind: 'inh', deps: ['L0.in'], rule: 'L₁.in := L.in', value: 'integer'},
    {id: 'L2.in', node: 'L2', name: 'in', kind: 'inh', deps: ['L1.in'], rule: 'L₁.in := L.in', value: 'integer'},
    {id: 'L2.act', node: 'L2', name: 'addtype(a)', kind: 'act', deps: ['L2.in'], rule: 'addtype(id.entry, L.in)', value: 'a : integer'},
    {id: 'L1.act', node: 'L1', name: 'addtype(b)', kind: 'act', deps: ['L1.in'], rule: 'addtype(id.entry, L.in)', value: 'b : integer'},
    {id: 'L0.act', node: 'L0', name: 'addtype(c)', kind: 'act', deps: ['L0.in'], rule: 'addtype(id.entry, L.in)', value: 'c : integer'},
  ],
};

export const scenarios = [calcScenario, declScenario];
