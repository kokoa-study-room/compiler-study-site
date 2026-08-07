import {useMemo, useState} from 'react';
import clsx from 'clsx';
import type {Grammar} from './types';
import {EOI, EPS, showProduction} from './types';
import styles from './styles.module.css';

/**
 * FIRST / FOLLOW 집합을 **고정점에 도달할 때까지** 반복 계산하고,
 * 각 라운드의 결과를 보여 준다.
 *
 * 교안 12장의 알고리즘을 그대로 옮겼다. 핵심은 두 집합 모두
 * "더 이상 아무것도 추가되지 않을 때까지 규칙을 반복 적용"한다는 것이다.
 * 몇 번째 라운드에서 무엇이 새로 들어오는지 보면
 * 왜 한 번 훑는 것으로는 부족한지가 분명해진다.
 */

type Sets = Record<string, Set<string>>;

function clone(s: Sets): Sets {
  const out: Sets = {};
  for (const k of Object.keys(s)) out[k] = new Set(s[k]);
  return out;
}

function sizeOf(s: Sets): number {
  return Object.values(s).reduce((n, set) => n + set.size, 0);
}

/** 심볼 열 α 의 FIRST. ε 는 α 전체가 ε 를 유도할 수 있을 때만 포함된다. */
function firstOfSeq(seq: string[], first: Sets, isNT: (s: string) => boolean) {
  const out = new Set<string>();
  let allNullable = true;
  for (const X of seq) {
    if (!isNT(X)) {
      out.add(X);
      allNullable = false;
      break;
    }
    for (const t of first[X] ?? []) if (t !== EPS) out.add(t);
    if (!first[X]?.has(EPS)) {
      allNullable = false;
      break;
    }
  }
  if (allNullable) out.add(EPS);
  return out;
}

function compute(g: Grammar) {
  const isNT = (s: string) => g.nonterminals.includes(s);

  /* ── FIRST ── */
  const first: Sets = {};
  for (const A of g.nonterminals) first[A] = new Set();
  const firstRounds: Sets[] = [];

  for (let guard = 0; guard < 100; guard++) {
    const before = sizeOf(first);
    for (const p of g.productions) {
      if (!isNT(p.lhs)) continue;
      for (const t of firstOfSeq(p.rhs, first, isNT)) first[p.lhs].add(t);
    }
    firstRounds.push(clone(first));
    if (sizeOf(first) === before) break;
  }

  /* ── FOLLOW ── */
  const follow: Sets = {};
  for (const A of g.nonterminals) follow[A] = new Set();
  follow[g.start].add(EOI);
  const followRounds: Sets[] = [];

  for (let guard = 0; guard < 100; guard++) {
    const before = sizeOf(follow);
    for (const p of g.productions) {
      if (!isNT(p.lhs)) continue;
      for (let i = 0; i < p.rhs.length; i++) {
        const B = p.rhs[i];
        if (!isNT(B)) continue;
        const beta = p.rhs.slice(i + 1);
        const fb = firstOfSeq(beta, first, isNT);
        for (const t of fb) if (t !== EPS) follow[B].add(t);
        // β 가 ε 를 유도할 수 있으면 (β 가 비어 있는 경우 포함) FOLLOW(A) 도 들어온다
        if (fb.has(EPS)) for (const t of follow[p.lhs]) follow[B].add(t);
      }
    }
    followRounds.push(clone(follow));
    if (sizeOf(follow) === before) break;
  }

  return {first, follow, firstRounds, followRounds, isNT};
}

function fmt(set: Set<string> | undefined, order: readonly string[]): string {
  if (!set || set.size === 0) return '∅';
  const rank = (t: string) => {
    const i = order.indexOf(t);
    return i === -1 ? order.length + (t === EPS ? 1 : 0) : i;
  };
  return `{ ${[...set].sort((a, b) => rank(a) - rank(b)).join(', ')} }`;
}

export type FirstFollowProps = {
  grammar: Grammar;
  title?: string;
  /** 생성 규칙 목록을 함께 보여 줄지 */
  showGrammar?: boolean;
};

export default function FirstFollow({
  grammar,
  title = 'FIRST / FOLLOW 계산',
  showGrammar = true,
}: FirstFollowProps) {
  const {first, follow, firstRounds, followRounds} = useMemo(
    () => compute(grammar),
    [grammar],
  );

  const totalRounds = Math.max(firstRounds.length, followRounds.length);
  const [round, setRound] = useState(totalRounds);

  const order = useMemo(
    () => [...grammar.terminals, EOI, EPS],
    [grammar.terminals],
  );

  const fView = firstRounds[Math.min(round, firstRounds.length) - 1] ?? first;
  const foView =
    round >= followRounds.length
      ? follow
      : (followRounds[Math.max(0, round - 1)] ??
        Object.fromEntries(grammar.nonterminals.map((A) => [A, new Set()])));

  const showFollow = round >= 1;
  const atEnd = round >= totalRounds;

  return (
    <div className={styles.sim}>
      <div className={styles.simTitle}>{title}</div>

      {showGrammar && (
        <ol className={styles.prodList}>
          {grammar.productions.map((p, i) => (
            <li key={i}>
              <span className={styles.prodNum}>({i})</span>{' '}
              <code>{showProduction(p)}</code>
            </li>
          ))}
        </ol>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.traceTable}>
          <thead>
            <tr>
              <th>넌터미널</th>
              <th>FIRST</th>
              <th>FOLLOW</th>
            </tr>
          </thead>
          <tbody>
            {grammar.nonterminals.map((A) => {
              const grewF =
                round > 1 &&
                (firstRounds[Math.min(round, firstRounds.length) - 1]?.[A]
                  ?.size ?? 0) >
                  (firstRounds[Math.min(round, firstRounds.length) - 2]?.[A]
                    ?.size ?? 0);
              return (
                <tr key={A}>
                  <td className={styles.stackCell}>{A}</td>
                  <td className={clsx(styles.setCell, grewF && styles.setGrew)}>
                    {fmt(fView?.[A], order)}
                  </td>
                  <td className={styles.setCell}>
                    {showFollow ? fmt(foView?.[A], order) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className="button button--sm button--secondary"
          onClick={() => setRound(1)}
          disabled={round <= 1}>
          ⟲ 처음
        </button>
        <button
          type="button"
          className="button button--sm button--primary"
          onClick={() => setRound((r) => Math.min(totalRounds, r + 1))}
          disabled={atEnd}>
          다음 라운드 ▶
        </button>
        <button
          type="button"
          className="button button--sm button--secondary"
          onClick={() => setRound(totalRounds)}
          disabled={atEnd}>
          고정점까지
        </button>
        <span className={styles.stepCount}>
          {Math.min(round, totalRounds)} / {totalRounds} 라운드
        </span>
      </div>

      <div className={clsx(styles.note, atEnd && styles.noteAccept)}>
        {atEnd
          ? `${totalRounds}번째 라운드에서 아무것도 추가되지 않았다 — 고정점 도달.`
          : `${round}번째 라운드까지의 결과. 아직 자라는 중이다.`}
      </div>
    </div>
  );
}
