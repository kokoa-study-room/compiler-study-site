import {useId, useMemo, type ReactNode} from 'react';
import clsx from 'clsx';
import type {AutomatonEdge, AutomatonSpec, Highlight} from './types';
import {edgeKey} from './types';
import styles from './styles.module.css';

const R = 22; // 상태 원의 반지름
const PAD = 44; // viewBox 여백
const ARROW = 9; // 화살촉 길이만큼 끝을 당겨 준다

type Point = {x: number; y: number};

/** 같은 (from,to) 쌍의 간선을 하나로 합치고, 겹치는 간선에 곡률을 배분한다. */
function normalizeEdges(edges: readonly AutomatonEdge[]): AutomatonEdge[] {
  // 1) 같은 방향의 간선은 라벨을 합친다: q0→q1 on a, q0→q1 on b  ⇒  "a, b"
  const merged = new Map<string, AutomatonEdge>();
  for (const e of edges) {
    const k = `${edgeKey(e.from, e.to)}#${e.bend ?? 'auto'}`;
    const prev = merged.get(k);
    if (prev) {
      const labels = new Set([
        ...prev.label.split(',').map((s) => s.trim()),
        ...e.label.split(',').map((s) => s.trim()),
      ]);
      prev.label = [...labels].join(', ');
    } else {
      merged.set(k, {...e});
    }
  }

  // 2) 곡률이 지정되지 않은 간선에 자동으로 배분한다.
  //    같은 노드 쌍(방향 무시)에 간선이 둘이면 서로 반대로 휘게 해 겹침을 막는다.
  const out = [...merged.values()];
  const pairCount = new Map<string, number>();
  for (const e of out) {
    if (e.from === e.to) continue;
    const k = [e.from, e.to].sort().join('~');
    pairCount.set(k, (pairCount.get(k) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  for (const e of out) {
    if (e.bend !== undefined || e.from === e.to) continue;
    const k = [e.from, e.to].sort().join('~');
    const total = pairCount.get(k) ?? 1;
    if (total === 1) {
      e.bend = 0;
    } else {
      const i = seen.get(k) ?? 0;
      seen.set(k, i + 1);
      // 두 방향이 서로 다른 쪽으로 휘도록 부호를 갈라 준다
      e.bend = (i % 2 === 0 ? 1 : -1) * (26 + Math.floor(i / 2) * 20);
    }
  }
  return out;
}

/** 두 점 사이의 곡선 경로와 라벨 위치를 계산한다. */
function curveBetween(a: Point, b: Point, bend: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // 진행 방향의 왼쪽 법선
  const nx = -uy;
  const ny = ux;

  const mid = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
  const ctrl = {x: mid.x + nx * bend, y: mid.y + ny * bend};

  // 원 경계에서 시작/끝나도록, 제어점 방향을 향해 반지름만큼 밀어낸다
  const toCtrlA = {x: ctrl.x - a.x, y: ctrl.y - a.y};
  const la = Math.hypot(toCtrlA.x, toCtrlA.y) || 1;
  const start = {x: a.x + (toCtrlA.x / la) * R, y: a.y + (toCtrlA.y / la) * R};

  const toCtrlB = {x: ctrl.x - b.x, y: ctrl.y - b.y};
  const lb = Math.hypot(toCtrlB.x, toCtrlB.y) || 1;
  const end = {
    x: b.x + (toCtrlB.x / lb) * (R + ARROW),
    y: b.y + (toCtrlB.y / lb) * (R + ARROW),
  };

  // 2차 베지어의 t=0.5 지점
  const labelAt = {
    x: 0.25 * start.x + 0.5 * ctrl.x + 0.25 * end.x,
    y: 0.25 * start.y + 0.5 * ctrl.y + 0.25 * end.y,
  };

  return {
    d: `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`,
    labelAt: {x: labelAt.x + nx * 11, y: labelAt.y + ny * 11},
  };
}

/** 자기 자신으로 가는 전이는 노드 위쪽에 고리로 그린다. */
function selfLoop(p: Point) {
  const w = 17;
  const h = 40;
  const sx = p.x - w;
  const sy = p.y - R + 4;
  const ex = p.x + w;
  const ey = p.y - R + 4;
  return {
    d: `M ${sx} ${sy} C ${p.x - w - 6} ${p.y - h - R} ${p.x + w + 6} ${
      p.y - h - R
    } ${ex} ${ey}`,
    labelAt: {x: p.x, y: p.y - R - h * 0.72},
  };
}

export type AutomatonDiagramProps = {
  spec: AutomatonSpec;
  highlight?: Highlight;
  /** 그림 아래에 붙일 설명 */
  caption?: ReactNode;
  className?: string;
};

export default function AutomatonDiagram({
  spec,
  highlight,
  caption,
  className,
}: AutomatonDiagramProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const edges = useMemo(() => normalizeEdges(spec.edges), [spec.edges]);

  const posOf = useMemo(() => {
    const m = new Map<string, Point>();
    for (const s of spec.states) m.set(s.id, {x: s.x, y: s.y});
    return m;
  }, [spec.states]);

  const {vbWidth, vbHeight, minX, minY} = useMemo(() => {
    const xs = spec.states.map((s) => s.x);
    const ys = spec.states.map((s) => s.y);
    const lo = {x: Math.min(...xs), y: Math.min(...ys)};
    const hi = {x: Math.max(...xs), y: Math.max(...ys)};
    return {
      minX: spec.minX ?? lo.x - PAD - 26, // 시작 화살표 자리
      minY: spec.minY ?? lo.y - PAD - 22, // 자기 고리 자리
      vbWidth: spec.width ?? hi.x - lo.x + PAD * 2 + 26,
      vbHeight: spec.height ?? hi.y - lo.y + PAD * 2 + 22,
    };
  }, [spec.states, spec.minX, spec.minY, spec.width, spec.height]);

  const active = new Set(highlight?.active ?? []);
  const activeEdges = new Set(highlight?.activeEdges ?? []);
  const verdict = highlight?.verdict ?? null;

  const startPos = posOf.get(spec.start);

  return (
    <figure className={clsx(styles.figure, className)}>
      <svg
        className={styles.svg}
        viewBox={`${minX} ${minY} ${vbWidth} ${vbHeight}`}
        role="img"
        aria-label="유한 오토마타 상태 전이도">
        <defs>
          <marker
            id={`arrow-${uid}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className={styles.arrowHead} />
          </marker>
          <marker
            id={`arrow-active-${uid}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse">
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              className={styles.arrowHeadActive}
            />
          </marker>
        </defs>

        {/* 시작 화살표 */}
        {startPos && (
          <line
            x1={startPos.x - R - 26}
            y1={startPos.y}
            x2={startPos.x - R - ARROW}
            y2={startPos.y}
            className={styles.edge}
            markerEnd={`url(#arrow-${uid})`}
          />
        )}

        {/* 간선 */}
        {edges.map((e) => {
          const a = posOf.get(e.from);
          const b = posOf.get(e.to);
          if (!a || !b) return null;
          const isActive = activeEdges.has(edgeKey(e.from, e.to));
          const geom =
            e.from === e.to ? selfLoop(a) : curveBetween(a, b, e.bend ?? 0);
          return (
            <g key={`${e.from}-${e.to}-${e.label}`}>
              <path
                d={geom.d}
                className={clsx(styles.edge, isActive && styles.edgeActive)}
                markerEnd={`url(#arrow${isActive ? '-active' : ''}-${uid})`}
              />
              <text
                x={geom.labelAt.x}
                y={geom.labelAt.y}
                className={clsx(
                  styles.edgeLabel,
                  isActive && styles.edgeLabelActive,
                )}
                textAnchor="middle"
                dominantBaseline="middle">
                {e.label}
              </text>
            </g>
          );
        })}

        {/* 상태 */}
        {spec.states.map((s) => {
          const isActive = active.has(s.id);
          const stateClass = clsx(
            styles.stateCircle,
            isActive && styles.stateActive,
            isActive && verdict === 'accept' && styles.stateAccept,
            isActive && verdict === 'reject' && styles.stateReject,
          );
          return (
            <g key={s.id}>
              {s.accepting && (
                <circle cx={s.x} cy={s.y} r={R + 5} className={stateClass} />
              )}
              <circle cx={s.x} cy={s.y} r={R} className={stateClass} />
              <text
                x={s.x}
                y={s.y}
                className={styles.stateLabel}
                textAnchor="middle"
                dominantBaseline="central">
                {s.label ?? s.id}
              </text>
            </g>
          );
        })}
      </svg>
      {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
    </figure>
  );
}
