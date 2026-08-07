/**
 * 구문 분석 시각화 컴포넌트가 공유하는 자료형.
 *
 * 문법은 생성 규칙의 배열로 표현한다. 배열의 **인덱스가 곧 규칙 번호**이고,
 * 이 번호가 LR 표의 reduce 액션(r3 등)과 그대로 대응한다.
 * 0번은 관례대로 증강 규칙(S' → S)에 쓴다.
 */

export type Production = {
  lhs: string;
  /** 빈 배열이면 ε 생성 규칙 */
  rhs: string[];
};

export type Grammar = {
  productions: Production[];
  start: string;
  nonterminals: string[];
  terminals: string[];
};

/** 입력 끝을 나타내는 기호 */
export const EOI = '$';
/** ε 를 화면에 표시할 때 쓰는 기호 */
export const EPS = 'ε';

export function showProduction(p: Production): string {
  return `${p.lhs} → ${p.rhs.length ? p.rhs.join(' ') : EPS}`;
}

/* ── LL(1) ──────────────────────────────────────────────── */

/** M[넌터미널][터미널] = 생성 규칙 번호 */
export type LLTable = Record<string, Record<string, number>>;

/* ── LR ─────────────────────────────────────────────────── */

export type LRAction =
  | {t: 'shift'; to: number}
  | {t: 'reduce'; prod: number}
  | {t: 'accept'};

export type LRTable = {
  /** ACTION[상태][터미널] */
  action: Record<number, Record<string, LRAction>>;
  /** GOTO[상태][넌터미널] */
  goto: Record<number, Record<string, number>>;
};

/** 파싱 한 단계의 기록 */
export type Step = {
  stack: string;
  input: string;
  action: string;
  /** 이 단계에서 적용한 생성 규칙 (있으면) */
  prod?: number;
  kind: 'shift' | 'reduce' | 'match' | 'expand' | 'accept' | 'error';
};
