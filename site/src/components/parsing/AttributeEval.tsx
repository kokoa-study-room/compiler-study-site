import {useMemo, useState} from 'react';
import clsx from 'clsx';
import {
  postorder,
  postorderWorks,
  topologicalOrder,
  type AttrScenario,
} from './attributes';
import styles from './styles.module.css';

/**
 * 주석 달린 파스 트리에서 속성값이 채워지는 과정을 한 걸음씩 보여 준다.
 *
 * 보여 주려는 것은 값 자체가 아니라 **순서**다.
 * 합성 속성만 있으면 값이 아래에서 위로 올라가고,
 * 상속 속성이 끼면 위에서 아래로 내려온다.
 * 후위 순회(= LR 파서의 액션 순서)로 되는지 여부도 함께 표시한다.
 */

export type AttributeEvalProps = {
  scenarios: readonly AttrScenario[];
  title?: string;
};

const KIND_LABEL = {
  syn: '합성',
  inh: '상속',
  act: '액션',
} as const;

export default function AttributeEval({
  scenarios,
  title = '속성 평가 순서',
}: AttributeEvalProps) {
  const [which, setWhich] = useState(0);
  const [shown, setShown] = useState(0);

  const sc = scenarios[which];
  const order = useMemo(() => topologicalOrder(sc) ?? [], [sc]);
  const attrById = useMemo(
    () => new Map(sc.attrs.map((a) => [a.id, a])),
    [sc],
  );
  const byNode = useMemo(() => {
    const m = new Map<string, typeof sc.attrs>();
    for (const a of sc.attrs) {
      const arr = m.get(a.node) ?? [];
      arr.push(a);
      m.set(a.node, arr as typeof sc.attrs);
    }
    return m;
  }, [sc]);
  const nodeById = useMemo(() => new Map(sc.nodes.map((n) => [n.id, n])), [sc]);

  const clamped = Math.min(shown, order.length);
  const filled = useMemo(() => new Set(order.slice(0, clamped)), [order, clamped]);
  const currentId = clamped > 0 ? order[clamped - 1] : null;
  const current = currentId ? attrById.get(currentId) : null;
  const done = clamped >= order.length;

  const worksInPostorder = useMemo(() => postorderWorks(sc), [sc]);
  const poRank = useMemo(
    () => new Map(postorder(sc).map((id, i) => [id, i])),
    [sc],
  );

  const pick = (i: number) => {
    setWhich(i);
    setShown(0);
  };

  /** 트리를 중첩 목록으로 그린다 */
  const renderNode = (id: string): React.ReactNode => {
    const n = nodeById.get(id);
    if (!n) return null;
    const attrs = byNode.get(id) ?? [];
    const isCurrent = current?.node === id;
    return (
      <li key={id}>
        <span className={clsx(styles.attrNode, isCurrent && styles.attrNodeCurrent)}>
          <span className={styles.attrSymbol}>{n.label}</span>
          {n.lexeme && n.lexeme !== n.label && (
            <span className={styles.attrLexeme}>{n.lexeme}</span>
          )}
          {attrs.map((a) => {
            const on = filled.has(a.id);
            return (
              <span
                key={a.id}
                className={clsx(
                  styles.attrChip,
                  styles[`attrChip_${a.kind}`],
                  on && styles.attrChipOn,
                  a.id === currentId && styles.attrChipCurrent,
                )}
                title={a.rule}>
                {a.name}
                {' = '}
                {on ? a.value : '?'}
              </span>
            );
          })}
        </span>
        {n.children.length > 0 && <ul>{n.children.map(renderNode)}</ul>}
      </li>
    );
  };

  return (
    <div className={styles.sim}>
      <div className={styles.simTitle}>{title}</div>

      <div className={styles.inputRow}>
        {scenarios.map((s, i) => (
          <button
            key={s.key}
            type="button"
            className={clsx(styles.sample, i === which && styles.sampleActive)}
            onClick={() => pick(i)}>
            {s.title.replace(/`/g, '')}
          </button>
        ))}
      </div>

      <div
        className={clsx(
          styles.note,
          worksInPostorder ? styles.noteAccept : styles.noteError,
        )}>
        {worksInPostorder ? (
          <>
            <strong>후위 순회 한 번으로 계산된다.</strong> 모든 의존이 자기 후손
            안에 있다 — S-속성 문법이다. LR 파서가 축약할 때 그 자리에서 값이
            정해지므로 <code>{'$$'} = f({'$1'}, {'$3'})</code> 로 쓸 수 있다.
          </>
        ) : (
          <>
            <strong>후위 순회로는 계산되지 않는다.</strong> 값이 부모에서
            자식으로 내려오는데, 후위 순회는 자식을 먼저 방문한다. 아래 <em>후위
            순회 순위</em> 열이 커졌다 작아졌다 하는 것을 보라. yacc 에서
            중간 액션이 필요해지는 자리가 정확히 여기다.
          </>
        )}
      </div>

      <div className={styles.attrLayout}>
        <div className={styles.attrTreeWrap}>
          <div className={styles.attrCaption}>주석 달린 파스 트리</div>
          <ul className={styles.attrTree}>{renderNode(sc.nodes[0].id)}</ul>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.traceTable}>
            <thead>
              <tr>
                <th className={styles.numCol}>#</th>
                <th>속성</th>
                <th>종류</th>
                <th>의미 규칙</th>
                <th>값</th>
                <th className={styles.numCol}>후위</th>
              </tr>
            </thead>
            <tbody>
              {order.slice(0, Math.max(clamped, 1)).map((id, i) => {
                const a = attrById.get(id)!;
                if (i >= clamped) return null;
                return (
                  <tr key={id} className={clsx(i === clamped - 1 && styles.rowCurrent)}>
                    <td className={styles.numCol}>{i + 1}</td>
                    <td className={styles.stackCell}>{a.id}</td>
                    <td>
                      <span className={clsx(styles.attrChip, styles[`attrChip_${a.kind}`], styles.attrChipOn)}>
                        {KIND_LABEL[a.kind]}
                      </span>
                    </td>
                    <td className={styles.inputCell}>{a.rule}</td>
                    <td className={styles.stackCell}>{a.value}</td>
                    <td className={styles.numCol}>{poRank.get(a.node)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className="button button--sm button--secondary"
          onClick={() => setShown(0)}
          disabled={clamped === 0}>
          ⟲ 처음
        </button>
        <button
          type="button"
          className="button button--sm button--secondary"
          onClick={() => setShown((n) => Math.max(0, n - 1))}
          disabled={clamped === 0}>
          ◀ 이전
        </button>
        <button
          type="button"
          className="button button--sm button--primary"
          onClick={() => setShown((n) => Math.min(order.length, n + 1))}
          disabled={done}>
          다음 ▶
        </button>
        <button
          type="button"
          className="button button--sm button--secondary"
          onClick={() => setShown(order.length)}
          disabled={done}>
          끝까지
        </button>
        <span className={styles.stepCount}>
          {clamped} / {order.length} 개 속성
        </span>
      </div>

      {current && (
        <div className={styles.note}>
          <strong>{current.id}</strong> ← <code>{current.rule}</code>
          {current.deps.length > 0 && (
            <>
              {' '}
              (먼저 필요한 것: {current.deps.join(', ')})
            </>
          )}
        </div>
      )}
    </div>
  );
}
