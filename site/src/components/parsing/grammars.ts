/**
 * 교안 4부 전체에서 되풀이해 쓰는 표준 문법과 파싱 표.
 *
 * 한 곳에 모아 두는 이유는 여러 장에서 **같은 문법**을 쓰기 위해서다.
 * 12장에서 FIRST/FOLLOW 를 구한 문법으로 13장에서 LL(1) 표를 만들고,
 * 14장에서 같은 언어의 LR 표를 만들어 비교한다.
 */

import type {Grammar, LLTable, LRTable} from './types';

/* ══════════════════════════════════════════════════════════
 * 1. 식 문법 — 좌재귀 버전 (LR 용)
 *
 *   (0) E' → E          증강 규칙
 *   (1) E  → E + T
 *   (2) E  → T
 *   (3) T  → T * F
 *   (4) T  → F
 *   (5) F  → ( E )
 *   (6) F  → id
 * ══════════════════════════════════════════════════════════ */

export const exprGrammarLR: Grammar = {
  start: "E'",
  nonterminals: ["E'", 'E', 'T', 'F'],
  terminals: ['id', '+', '*', '(', ')'],
  productions: [
    {lhs: "E'", rhs: ['E']},
    {lhs: 'E', rhs: ['E', '+', 'T']},
    {lhs: 'E', rhs: ['T']},
    {lhs: 'T', rhs: ['T', '*', 'F']},
    {lhs: 'T', rhs: ['F']},
    {lhs: 'F', rhs: ['(', 'E', ')']},
    {lhs: 'F', rhs: ['id']},
  ],
};

/** 증강 규칙을 뺀, FIRST/FOLLOW 설명용 버전 */
export const exprGrammar: Grammar = {
  start: 'E',
  nonterminals: ['E', 'T', 'F'],
  terminals: ['id', '+', '*', '(', ')'],
  productions: [
    {lhs: 'E', rhs: ['E', '+', 'T']},
    {lhs: 'E', rhs: ['T']},
    {lhs: 'T', rhs: ['T', '*', 'F']},
    {lhs: 'T', rhs: ['F']},
    {lhs: 'F', rhs: ['(', 'E', ')']},
    {lhs: 'F', rhs: ['id']},
  ],
};

/**
 * SLR(1) 파싱 표. Dragon Book 그림 4.37 과 같은 표다.
 * 이 표는 14장에서 항목 집합 C0~C11 로부터 손으로 만들어 낸다.
 */
export const exprSLRTable: LRTable = {
  action: {
    0: {id: {t: 'shift', to: 5}, '(': {t: 'shift', to: 4}},
    1: {'+': {t: 'shift', to: 6}, $: {t: 'accept'}},
    2: {
      '+': {t: 'reduce', prod: 2},
      '*': {t: 'shift', to: 7},
      ')': {t: 'reduce', prod: 2},
      $: {t: 'reduce', prod: 2},
    },
    3: {
      '+': {t: 'reduce', prod: 4},
      '*': {t: 'reduce', prod: 4},
      ')': {t: 'reduce', prod: 4},
      $: {t: 'reduce', prod: 4},
    },
    4: {id: {t: 'shift', to: 5}, '(': {t: 'shift', to: 4}},
    5: {
      '+': {t: 'reduce', prod: 6},
      '*': {t: 'reduce', prod: 6},
      ')': {t: 'reduce', prod: 6},
      $: {t: 'reduce', prod: 6},
    },
    6: {id: {t: 'shift', to: 5}, '(': {t: 'shift', to: 4}},
    7: {id: {t: 'shift', to: 5}, '(': {t: 'shift', to: 4}},
    8: {'+': {t: 'shift', to: 6}, ')': {t: 'shift', to: 11}},
    9: {
      '+': {t: 'reduce', prod: 1},
      '*': {t: 'shift', to: 7},
      ')': {t: 'reduce', prod: 1},
      $: {t: 'reduce', prod: 1},
    },
    10: {
      '+': {t: 'reduce', prod: 3},
      '*': {t: 'reduce', prod: 3},
      ')': {t: 'reduce', prod: 3},
      $: {t: 'reduce', prod: 3},
    },
    11: {
      '+': {t: 'reduce', prod: 5},
      '*': {t: 'reduce', prod: 5},
      ')': {t: 'reduce', prod: 5},
      $: {t: 'reduce', prod: 5},
    },
  },
  goto: {
    0: {E: 1, T: 2, F: 3},
    4: {E: 8, T: 2, F: 3},
    6: {T: 9, F: 3},
    7: {F: 10},
  },
};

/* ══════════════════════════════════════════════════════════
 * 2. 같은 언어의 LL(1) 문법 — 좌재귀를 제거한 버전
 *
 *   (0) E  → T E'
 *   (1) E' → + T E'
 *   (2) E' → ε
 *   (3) T  → F T'
 *   (4) T' → * F T'
 *   (5) T' → ε
 *   (6) F  → ( E )
 *   (7) F  → id
 * ══════════════════════════════════════════════════════════ */

export const exprGrammarLL: Grammar = {
  start: 'E',
  nonterminals: ['E', "E'", 'T', "T'", 'F'],
  terminals: ['id', '+', '*', '(', ')'],
  productions: [
    {lhs: 'E', rhs: ['T', "E'"]},
    {lhs: "E'", rhs: ['+', 'T', "E'"]},
    {lhs: "E'", rhs: []},
    {lhs: 'T', rhs: ['F', "T'"]},
    {lhs: "T'", rhs: ['*', 'F', "T'"]},
    {lhs: "T'", rhs: []},
    {lhs: 'F', rhs: ['(', 'E', ')']},
    {lhs: 'F', rhs: ['id']},
  ],
};

/** 13장에서 FIRST/FOLLOW 로부터 만들어 내는 예측 파싱 표 */
export const exprLLTable: LLTable = {
  E: {id: 0, '(': 0},
  "E'": {'+': 1, ')': 2, $: 2},
  T: {id: 3, '(': 3},
  "T'": {'+': 5, '*': 4, ')': 5, $: 5},
  F: {'(': 6, id: 7},
};

/* ══════════════════════════════════════════════════════════
 * 3. 문장 문법 — dangling else 를 보여 주기 위한 것
 * ══════════════════════════════════════════════════════════ */

export const stmtGrammar: Grammar = {
  start: 'S',
  nonterminals: ['S'],
  terminals: ['if', 'expr', 'then', 'else', 'other'],
  productions: [
    {lhs: 'S', rhs: ['if', 'expr', 'then', 'S']},
    {lhs: 'S', rhs: ['if', 'expr', 'then', 'S', 'else', 'S']},
    {lhs: 'S', rhs: ['other']},
  ],
};
