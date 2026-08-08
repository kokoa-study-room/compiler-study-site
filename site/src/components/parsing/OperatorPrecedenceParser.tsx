import {useMemo, useState} from 'react';
import clsx from 'clsx';
import {
  simulateOperatorPrecedence,
  REL_SYMBOL,
  type PrecGrammar,
  type PrecTable,
} from './precedence';
import {EOI} from './types';
import styles from './styles.module.css';

/**
 * 연산자 우선순위 파서 시뮬레이터.
 *
 * 알고리즘 본체는 `precedence.ts` 에 있고 여기서는 표시만 담당한다.
 * 왼쪽에 우선 관계 표를 함께 그려서, **지금 어느 칸을 보고 있는지**를
 * 강조한다. 이 기법의 요점이 "표 한 칸이 파스 트리를 정한다"이므로
 * 그 칸을 눈으로 좇을 수 있어야 한다.
 */

export type OperatorPrecedenceParserProps = {
  grammar: PrecGrammar;
  table: PrecTable;
  /** 표를 그릴 때의 행·열 순서 */
  order: readonly string[];
  defaultInput: string;
  samples?: readonly string[];
  title?: string;
};

export default function OperatorPrecedenceParser({
  grammar,
  table,
  order,
  defaultInput,
  samples = [],
  title = '연산자 우선순위 파서',
}: OperatorPrecedenceParserProps) {
  const [text, setText] = useState(defaultInput);
  const [shown, setShown] = useState(1);

  const tokens = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);
  const steps = useMemo(
    () => simulateOperatorPrecedence(grammar, table, tokens),
    [grammar, table, tokens],
  );

  const clamped = Math.min(shown, steps.length);
  const visible = steps.slice(0, clamped);
  const current = visible[visible.length - 1];
  const done = clamped >= steps.length;
  const finalKind = steps[steps.length - 1]?.kind;

  /** 지금 보고 있는 표의 칸 — "a ⋖ b" 에서 a 와 b */
  const [row, col] = useMemo(() => {
    const m = current?.relation.match(/^(\S+) [⋖≐⋗?] (\S+)$/);
    return m ? [m[1], m[2]] : [null, null];
  }, [current]);

  const setTextAndReset = (v: string) => {
    setText(v);
    setShown(1);
  };

  return (
    <div className={styles.sim}>
      <div className={styles.simTitle}>{title}</div>

      <div className={styles.precLayout}>
        {/* ── 우선 관계 표 ── */}
        <div className={styles.tableWrap}>
          <table className={styles.precTable}>
            <thead>
              <tr>
                <th />
                {order.map((t) => (
                  <th key={t} className={clsx(t === col && styles.precColHit)}>
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.map((a) => (
                <tr key={a}>
                  <th className={clsx(a === row && styles.precColHit)}>{a}</th>
                  {order.map((b) => {
                    const rel = table[a]?.[b];
                    const hit = a === row && b === col;
                    return (
                      <td
                        key={b}
                        className={clsx(
                          rel === undefined && styles.precEmpty,
                          hit && styles.precHit,
                        )}>
                        {rel ? REL_SYMBOL[rel] : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── 추적표 ── */}
        <div className={styles.tableWrap}>
          <table className={styles.traceTable}>
            <thead>
              <tr>
                <th className={styles.numCol}>#</th>
                <th>스택</th>
                <th>입력</th>
                <th>관계</th>
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
                  )}>
                  <td className={styles.numCol}>{i + 1}</td>
                  <td className={styles.stackCell}>{s.stack}</td>
                  <td className={styles.inputCell}>{s.input}</td>
                  <td className={styles.relCell}>{s.relation}</td>
                  <td>{s.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        {row && col && (
          <>
            스택 맨 위 터미널 <strong>{row}</strong>, 다음 입력{' '}
            <strong>{col === EOI ? '$' : col}</strong> → 표의{' '}
            <strong>
              {row} 행 {col} 열
            </strong>{' '}
            ={' '}
            <strong>{table[row]?.[col] ? REL_SYMBOL[table[row][col]!] : '빈 칸'}</strong>
            {' — '}
          </>
        )}
        {current?.action}
        {current?.handle && <> (핸들 <code>{current.handle}</code>)</>}
        {done && finalKind === 'accept' && (
          <strong> — 입력이 이 문법의 식이다.</strong>
        )}
      </div>

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
