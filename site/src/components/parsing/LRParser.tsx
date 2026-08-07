import {useMemo, useState} from 'react';
import clsx from 'clsx';
import type {Grammar, LRTable} from './types';
import {simulateLR} from './simulate';
import styles from './styles.module.css';

/**
 * 표 구동 LR 파서 시뮬레이터.
 * 알고리즘 본체는 `simulate.ts` 에 있고 여기서는 표시만 담당한다.
 */

export type LRParserProps = {
  grammar: Grammar;
  table: LRTable;
  defaultInput: string;
  samples?: readonly string[];
  title?: string;
};

export default function LRParser({
  grammar,
  table,
  defaultInput,
  samples = [],
  title = 'LR 파서 시뮬레이터',
}: LRParserProps) {
  const [text, setText] = useState(defaultInput);
  const [shown, setShown] = useState(1);

  const tokens = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);
  const steps = useMemo(
    () => simulateLR(grammar, table, tokens),
    [grammar, table, tokens],
  );

  const clamped = Math.min(shown, steps.length);
  const visible = steps.slice(0, clamped);
  const last = visible[visible.length - 1];
  const done = clamped >= steps.length;
  const finalKind = steps[steps.length - 1]?.kind;

  // 지금까지 적용한 축약을 역순으로 모으면 우측 유도가 된다
  const reductions = visible
    .filter((s) => s.kind === 'reduce')
    .map((s) => s.prod!)
    .reverse();

  const setTextAndReset = (v: string) => {
    setText(v);
    setShown(1);
  };

  return (
    <div className={styles.sim}>
      <div className={styles.simTitle}>{title}</div>

      <div className={styles.tableWrap}>
        <table className={styles.traceTable}>
          <thead>
            <tr>
              <th className={styles.numCol}>#</th>
              <th>스택</th>
              <th>입력</th>
              <th>동작</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((s, i) => (
              <tr
                key={i}
                className={clsx(
                  i === clamped - 1 && styles.rowCurrent,
                  s.kind === 'accept' && styles.rowAccept,
                  s.kind === 'error' && styles.rowError,
                  s.kind === 'reduce' && styles.rowReduce,
                )}>
                <td className={styles.numCol}>{i + 1}</td>
                <td className={styles.stackCell}>{s.stack}</td>
                <td className={styles.inputCell}>{s.input}</td>
                <td>{s.action}</td>
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
          disabled={clamped <= 1}>
          ⟲ 처음
        </button>
        <button
          type="button"
          className="button button--sm button--secondary"
          onClick={() => setShown((n) => Math.max(1, n - 1))}
          disabled={clamped <= 1}>
          ◀ 이전
        </button>
        <button
          type="button"
          className="button button--sm button--primary"
          onClick={() => setShown((n) => Math.min(steps.length, n + 1))}
          disabled={done}>
          다음 ▶
        </button>
        <button
          type="button"
          className="button button--sm button--secondary"
          onClick={() => setShown(steps.length)}
          disabled={done}>
          끝까지
        </button>
        <span className={styles.stepCount}>
          {clamped} / {steps.length} 단계
        </span>
      </div>

      <div
        className={clsx(
          styles.note,
          done && finalKind === 'accept' && styles.noteAccept,
          done && finalKind === 'error' && styles.noteError,
        )}>
        {last?.action}
        {done && finalKind === 'accept' && (
          <strong> — 입력이 이 문법의 문장이다.</strong>
        )}
      </div>

      {reductions.length > 0 && (
        <div className={styles.derivation}>
          <span className={styles.derivationLabel}>
            축약을 역순으로 읽으면 우측 유도:
          </span>{' '}
          {reductions.map((p) => `r${p}`).join(' → ')}
        </div>
      )}

      <div className={styles.inputRow}>
        <input
          className={styles.textInput}
          value={text}
          spellCheck={false}
          placeholder="토큰을 공백으로 구분해 입력 (예: id + id * id)"
          onChange={(e) => setTextAndReset(e.target.value)}
          aria-label="파싱할 토큰 열"
        />
        {samples.map((s) => (
          <button
            key={s}
            type="button"
            className={clsx(styles.sample, s === text && styles.sampleActive)}
            onClick={() => setTextAndReset(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
