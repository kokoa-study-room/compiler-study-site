/**
 * 오토마타 시각화 컴포넌트가 공유하는 자료형.
 *
 * 좌표는 SVG viewBox 단위(기본 반지름 22)를 그대로 쓴다.
 * 상태 배치는 자동 레이아웃 대신 손으로 지정한다 —
 * 교안용 오토마타는 대개 상태가 10개 미만이고,
 * "왼쪽에서 오른쪽으로 흐르는" 배치가 설명에 훨씬 유리하기 때문이다.
 */

export type AutomatonState = {
  /** 전이 함수에서 쓰는 고유 식별자 */
  id: string;
  /** 화면에 표시할 이름. 생략하면 id 를 쓴다 */
  label?: string;
  x: number;
  y: number;
  /** 종결 상태(accepting/final)이면 이중 원으로 그린다 */
  accepting?: boolean;
};

export type AutomatonEdge = {
  from: string;
  to: string;
  /** 전이 기호. 쉼표로 여러 개를 적어도 되고, 같은 쌍의 간선은 자동으로 합쳐진다 */
  label: string;
  /**
   * 곡률. 양수면 진행 방향 기준 왼쪽, 음수면 오른쪽으로 휜다.
   * 생략하면 같은 노드 쌍 사이의 간선 개수를 보고 자동으로 정한다.
   */
  bend?: number;
};

export type AutomatonSpec = {
  states: AutomatonState[];
  edges: AutomatonEdge[];
  /** 시작 상태 id */
  start: string;
  /**
   * viewBox. 생략하면 상태 좌표에서 자동 계산한다.
   * 크게 휜 간선은 상태의 바운딩 박스를 벗어나므로,
   * 그럴 때는 네 값을 직접 지정해 잘리지 않게 한다.
   */
  minX?: number;
  minY?: number;
  width?: number;
  height?: number;
};

/** 시뮬레이터가 강조 표시할 대상 */
export type Highlight = {
  /** 현재 활성 상태 집합 */
  active?: readonly string[];
  /** 방금 사용한 간선들 (from|to 형태의 키) */
  activeEdges?: readonly string[];
  /** 최종 판정 — 색으로 성공/실패를 구분한다 */
  verdict?: 'accept' | 'reject' | null;
};

export const EPSILON = 'ε';

export function edgeKey(from: string, to: string): string {
  return `${from}|${to}`;
}
