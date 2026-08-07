import {useCallback, useMemo, useState} from 'react';
import clsx from 'clsx';
import AutomatonDiagram from './AutomatonDiagram';
import type {AutomatonSpec} from './types';
import {EPSILON, edgeKey} from './types';
import styles from './styles.module.css';

/**
 * NFA/DFA 공용 시뮬레이터.
 *
 * 내부적으로는 항상 **상태 집합**을 들고 다닌다.
 * DFA 는 그 집합의 크기가 늘 1인 특수한 경우일 뿐이므로 코드가 하나로 통일된다.
 * ε 전이는 매 단계마다 ε-closure 를 취해 처리한다.
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

/** ε 전이를 따라 도달 가능한 모든 상태를 모은다. */
function epsilonClosure(states: readonly string[], delta: Delta): string[] {
  const seen = new Set(states);
  const stack = [...states];
  while (stack.length) {
    const q = stack.pop()!;
    for (const next of delta.get(q)?.get(EPSILON) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }
  return [...seen];
}

type Frame = {
  /** 이 시점까지 읽은 문자 수 */
  consumed: number;
  /** 현재 활성 상태 집합 */
  states: string[];
  /** 직전 단계에서 사용한 간선 */
  usedEdges: string[];
  /** 방금 읽은 문자 (첫 프레임은 null) */
  symbol: string | null;
  /** 설명 문구 */
  note: string;
};

function simulate(spec: AutomatonSpec, input: string): Frame[] {
  const delta = buildDelta(spec);
  const frames: Frame[] = [];

  let current = epsilonClosure([spec.start], delta);
  frames.push({
    consumed: 0,
    states: current,
    usedEdges: [],
    symbol: null,
    note:
      current.length > 1
        ? `시작 상태 ${spec.start} 의 ε-closure = {${current.join(', ')}}`
        : `시작 상태 ${spec.start} 에서 출발`,
  });

  for (let i = 0; i < input.length; i++) {
    const sym = input[i];
    const moved = new Set<string>();
    const used: string[] = [];
    for (const q of current) {
      for (const next of delta.get(q)?.get(sym) ?? []) {
        moved.add(next);
        used.push(edgeKey(q, next));
      }
    }

    if (moved.size === 0) {
      frames.push({
        consumed: i + 1,
        states: [],
        usedEdges: [],
        symbol: sym,
        note: `'${sym}' 에 대한 전이가 없다 → 막다른 길, 거부`,
      });
      break;
    }

    const before = [...moved];
    current = epsilonClosure(before, delta);
    const grew = current.length > before.length;
    frames.push({
      consumed: i + 1,
      states: current,
      usedEdges: used,
      symbol: sym,
      note: grew
        ? `'${sym}' 읽음 → {${before.join(', ')}} 의 ε-closure = {${current.join(', ')}}`
        : `'${sym}' 읽음 → {${current.join(', ')}}`,
    });
  }

  return frames;
}

export type AutomatonSimulatorProps = {
  spec: AutomatonSpec;
  /** 초기 입력 문자열 */
  defaultInput?: string;
  /** 버튼 한 번으로 넣어 볼 수 있는 예시 입력들 */
  samples?: readonly string[];
  /** 사용자가 입력을 직접 고칠 수 있게 할지 */
  editable?: boolean;
  title?: string;
};

export default function AutomatonSimulator({
  spec,
  defaultInput = '',
  samples = [],
  editable = true,
  title,
}: AutomatonSimulatorProps) {
  const [input, setInput] = useState(defaultInput);
  const [step, setStep] = useState(0);

  const frames = useMemo(() => simulate(spec, input), [spec, input]);
  const accepting = useMemo(
    () => new Set(spec.states.filter((s) => s.accepting).map((s) => s.id)),
    [spec.states],
  );

  const clamped = Math.min(step, frames.length - 1);
  const frame = frames[clamped];
  const atEnd = clamped === frames.length - 1;
  const consumedAll = frame.consumed === input.length;

  const verdict = useMemo(() => {
    if (!atEnd || !consumedAll) return null;
    return frame.states.some((q) => accepting.has(q)) ? 'accept' : 'reject';
  }, [atEnd, consumedAll, frame.states, accepting]);

  const setInputAndReset = useCallback((v: string) => {
    setInput(v);
    setStep(0);
  }, []);

  return (
    <div className={styles.sim}>
      {title && <div className={styles.simTitle}>{title}</div>}

      <AutomatonDiagram
        spec={spec}
        highlight={{
          active: frame.states,
          activeEdges: frame.usedEdges,
          verdict,
        }}
      />

      {/* 입력 테이프 */}
      <div className={styles.tapeRow}>
        <span className={styles.tapeLabel}>입력</span>
        <div className={styles.tape}>
          {input.length === 0 && <span className={styles.tapeEmpty}>ε</span>}
          {[...input].map((ch, i) => (
            <span
              key={`${i}-${ch}`}
              className={clsx(
                styles.tapeCell,
                i < frame.consumed && styles.tapeCellDone,
                i === frame.consumed && styles.tapeCellNext,
              )}>
              {ch}
            </span>
          ))}
          <span
            className={clsx(
              styles.tapeCell,
              styles.tapeEnd,
              frame.consumed === input.length && styles.tapeCellNext,
            )}>
            ⊣
          </span>
        </div>
      </div>

      {/* 조작 */}
      <div className={styles.controls}>
        <button
          type="button"
          className="button button--sm button--secondary"
          onClick={() => setStep(0)}
          disabled={clamped === 0}>
          ⟲ 처음
        </button>
        <button
          type="button"
          className="button button--sm button--secondary"
          onClick={() => setStep((s) => Math.max(0, Math.min(s, frames.length - 1) - 1))}
          disabled={clamped === 0}>
          ◀ 이전
        </button>
        <button
          type="button"
          className="button button--sm button--primary"
          onClick={() => setStep((s) => Math.min(frames.length - 1, s + 1))}
          disabled={atEnd}>
          다음 ▶
        </button>
        <span className={styles.stepCount}>
          {clamped} / {frames.length - 1} 단계
        </span>
      </div>

      {/* 상태 설명 */}
      <div
        className={clsx(
          styles.note,
          verdict === 'accept' && styles.noteAccept,
          verdict === 'reject' && styles.noteReject,
        )}>
        {frame.note}
        {verdict === 'accept' && (
          <strong> — 종결 상태에 있으므로 이 스트링은 언어에 속한다.</strong>
        )}
        {verdict === 'reject' && (
          <strong>
            {' '}
            — {frame.states.length === 0
              ? '갈 곳이 없으므로'
              : '종결 상태가 아니므로'}{' '}
            이 스트링은 언어에 속하지 않는다.
          </strong>
        )}
      </div>

      {/* 입력 편집 */}
      {(editable || samples.length > 0) && (
        <div className={styles.inputRow}>
          {editable && (
            <input
              className={styles.textInput}
              value={input}
              spellCheck={false}
              placeholder="입력 스트링을 직접 쳐 보세요"
              onChange={(e) => setInputAndReset(e.target.value)}
              aria-label="시뮬레이션할 입력 스트링"
            />
          )}
          {samples.map((s) => (
            <button
              key={s}
              type="button"
              className={clsx(
                styles.sample,
                s === input && styles.sampleActive,
              )}
              onClick={() => setInputAndReset(s)}>
              {s === '' ? 'ε' : s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
