import {useMemo, useState} from 'react';
import clsx from 'clsx';
import type {AutomatonSpec} from './types';
import {EPSILON} from './types';
import styles from './styles.module.css';

/**
 * NFA → DFA 부분집합 구성(subset construction)을 한 행씩 진행하며 보여 준다.
 *
 * 각 "단계"는 워크리스트에서 미처리 부분집합 하나를 꺼내
 * 알파벳의 모든 기호에 대해 move + ε-closure 를 계산해 한 행을 채우는 것이다.
 * 이때 새로 등장한 부분집합은 다시 워크리스트에 들어간다.
 */

type Delta = Map<string, Map<string, string[]>>;

function buildDelta(spec: AutomatonSpec): Delta {
  const delta: Delta = new Map();
  for (const s of spec.states) delta.set(s.id, new Map());
  for (const e of spec.edges) {
    const bySymbol = delta.get(e.from);
    if (!bySymbol) continue;
    for (const raw of e.label.split(',')) {
      const sym = raw.trim();
      if (!sym) continue;
      const list = bySymbol.get(sym) ?? [];
      if (!list.includes(e.to)) list.push(e.to);
      bySymbol.set(sym, list);
    }
  }
  return delta;
}

function closure(states: readonly string[], delta: Delta): string[] {
  const seen = new Set(states);
  const stack = [...states];
  while (stack.length) {
    const q = stack.pop()!;
    for (const n of delta.get(q)?.get(EPSILON) ?? []) {
      if (!seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return [...seen];
}

function move(states: readonly string[], sym: string, delta: Delta): string[] {
  const out = new Set<string>();
  for (const q of states) {
    for (const n of delta.get(q)?.get(sym) ?? []) out.add(n);
  }
  return [...out];
}

type Row = {
  /** A, B, C … 로 붙인 DFA 상태 이름 */
  name: string;
  subset: string[];
  /** 기호 → 목적지 DFA 상태 이름 (없으면 null = 죽은 상태) */
  targets: Record<string, string | null>;
  accepting: boolean;
};

function dfaName(i: number): string {
  // A..Z, 그 뒤로는 A1, B1 …
  const letter = String.fromCharCode(65 + (i % 26));
  const round = Math.floor(i / 26);
  return round === 0 ? letter : `${letter}${round}`;
}

function construct(spec: AutomatonSpec, alphabet: readonly string[]) {
  const delta = buildDelta(spec);
  const acceptingSet = new Set(
    spec.states.filter((s) => s.accepting).map((s) => s.id),
  );
  // 상태 순서를 spec 에 적힌 순서로 고정해야 부분집합 표기가 안정적이다
  const order = new Map(spec.states.map((s, i) => [s.id, i] as const));
  const sortSubset = (xs: string[]) =>
    [...xs].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  const keyOf = (xs: string[]) => sortSubset(xs).join(',');

  const rows: Row[] = [];
  const indexByKey = new Map<string, number>();

  const start = sortSubset(closure([spec.start], delta));
  indexByKey.set(keyOf(start), 0);
  const subsets: string[][] = [start];

  for (let i = 0; i < subsets.length; i++) {
    const subset = subsets[i];
    const targets: Record<string, string | null> = {};
    for (const sym of alphabet) {
      const next = sortSubset(closure(move(subset, sym, delta), delta));
      if (next.length === 0) {
        targets[sym] = null;
        continue;
      }
      const k = keyOf(next);
      let idx = indexByKey.get(k);
      if (idx === undefined) {
        idx = subsets.length;
        indexByKey.set(k, idx);
        subsets.push(next);
      }
      targets[sym] = dfaName(idx);
    }
    rows.push({
      name: dfaName(i),
      subset,
      targets,
      accepting: subset.some((q) => acceptingSet.has(q)),
    });
  }

  return rows;
}

export type SubsetConstructionProps = {
  spec: AutomatonSpec;
  /** ε 를 제외한 입력 기호들 */
  alphabet: readonly string[];
  title?: string;
};

export default function SubsetConstruction({
  spec,
  alphabet,
  title = 'NFA → DFA 부분집합 구성',
}: SubsetConstructionProps) {
  const rows = useMemo(() => construct(spec, alphabet), [spec, alphabet]);
  const [shown, setShown] = useState(1);

  const visible = rows.slice(0, shown);
  const done = shown >= rows.length;

  // 아직 처리하지 않은, 그러나 이미 이름이 붙은 부분집합
  const pending = rows.slice(shown);

  return (
    <div className={styles.subset}>
      <div className={styles.simTitle}>{title}</div>

      <div style={{overflowX: 'auto'}}>
        <table className={styles.subsetTable}>
          <thead>
            <tr>
              <th>DFA 상태</th>
              <th>NFA 부분집합</th>
              {alphabet.map((s) => (
                <th key={s}>{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr
                key={r.name}
                className={clsx(
                  i === shown - 1 && shown > 1 && styles.rowNew,
                  r.accepting && styles.rowAccepting,
                )}>
                <td>
                  {r.name}
                  {r.accepting ? ' ✓' : ''}
                  {i === 0 ? ' ←시작' : ''}
                </td>
                <td>{`{${r.subset.join(', ')}}`}</td>
                {alphabet.map((s) => (
                  <td key={s}>{r.targets[s] ?? '—'}</td>
                ))}
              </tr>
            ))}
            {pending.map((r) => (
              <tr key={`p-${r.name}`} className={styles.pending}>
                <td>{r.name}</td>
                <td>{`{${r.subset.join(', ')}}`}</td>
                <td colSpan={alphabet.length}>처리 대기</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className="button button--sm button--secondary"
          onClick={() => setShown(1)}
          disabled={shown === 1}>
          ⟲ 처음
        </button>
        <button
          type="button"
          className="button button--sm button--primary"
          onClick={() => setShown((n) => Math.min(rows.length, n + 1))}
          disabled={done}>
          다음 상태 처리 ▶
        </button>
        <button
          type="button"
          className="button button--sm button--secondary"
          onClick={() => setShown(rows.length)}
          disabled={done}>
          끝까지
        </button>
        <span className={styles.stepCount}>
          {shown} / {rows.length} 상태
        </span>
      </div>

      <div className={clsx(styles.note, done && styles.noteAccept)}>
        {done
          ? `워크리스트가 비었다. DFA 상태 ${rows.length}개로 완성 — 이 중 ${rows.filter((r) => r.accepting).length}개가 종결 상태다. (✓ 표시)`
          : `${visible[visible.length - 1].name} = {${visible[visible.length - 1].subset.join(', ')}} 를 처리했다. 새로 등장한 부분집합은 아래에 "처리 대기"로 쌓인다.`}
      </div>
    </div>
  );
}
