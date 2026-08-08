import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type Stop = {
  part: string;
  title: string;
  blurb: string;
  chapters: {label: string; to: string}[];
};

const ROADMAP: Stop[] = [
  {
    part: '1부',
    title: '기초',
    blurb:
      '컴파일러가 소스 텍스트를 목적 코드로 바꾸기까지 어떤 단계를 거치는지 훑고, 그 전부를 떠받치는 "언어와 문법"이라는 형식 도구를 세운다.',
    chapters: [
      {label: '컴파일러 개요', to: '/docs/foundations/compiler-overview'},
      {label: '언어와 문법', to: '/docs/foundations/language-and-grammar'},
    ],
  },
  {
    part: '2부',
    title: '정규언어와 유한 오토마타',
    blurb:
      '어휘 분석의 이론. 정규 표현과 유한 오토마타가 정확히 같은 언어 집합을 표현한다는 사실, 그리고 둘 사이를 오가는 기계적인 변환 절차.',
    chapters: [
      {label: '정규언어', to: '/docs/regular/regular-languages'},
      {label: '정규 표현', to: '/docs/regular/regular-expressions'},
      {label: '유한 오토마타', to: '/docs/regular/finite-automata'},
      {label: '정규언어의 표현 방법', to: '/docs/regular/representations'},
    ],
  },
  {
    part: '3부',
    title: 'LEX',
    blurb:
      '2부를 자동화한 도구. 정규 표현을 적으면 DFA 기반 스캐너가 나온다. 최장 일치와 규칙 우선순위가 실제로 어떻게 동작하는지 확인한다.',
    chapters: [
      {label: 'LEX', to: '/docs/lex/lex-overview'},
      {label: 'LEX 입력 및 파싱', to: '/docs/lex/lex-input-and-parsing'},
      {label: 'LEX 입력 파일 작성', to: '/docs/lex/writing-lex-files'},
    ],
  },
  {
    part: '4부',
    title: '문맥 자유 문법과 구문 분석',
    blurb:
      '괄호처럼 중첩되는 구조는 정규언어로 셀 수 없다. CFG를 도입하고 LL(1)과 LR류 파서로 파스 트리를 만드는 알고리즘을 손으로 돌려 본다.',
    chapters: [
      {label: '문맥 자유 문법', to: '/docs/parsing/context-free-grammar'},
      {label: '문법의 유형', to: '/docs/parsing/grammar-hierarchy'},
      {label: '구문 분석', to: '/docs/parsing/syntax-analysis'},
      {label: 'LL 구문 분석', to: '/docs/parsing/ll-parsing'},
      {label: '연산자 우선순위 파싱', to: '/docs/parsing/operator-precedence'},
      {label: 'LR 구문 분석', to: '/docs/parsing/lr-parsing'},
      {label: 'LR 파서의 구현', to: '/docs/parsing/lr-parser-implementation'},
      {label: '구문 지향 번역', to: '/docs/parsing/syntax-directed-translation'},
    ],
  },
  {
    part: '5부',
    title: 'YACC',
    blurb:
      'LALR(1) 이론을 자동화한 도구. 충돌 보고서를 읽고 우선순위로 문법을 다듬은 뒤, lex와 묶어 하나의 프론트엔드를 완성한다.',
    chapters: [
      {label: 'YACC 개요', to: '/docs/yacc/yacc-overview'},
      {label: '문법과 액션', to: '/docs/yacc/yacc-grammar-and-actions'},
      {label: '충돌과 우선순위', to: '/docs/yacc/conflicts-and-precedence'},
    ],
  },
  {
    part: '6부',
    title: '심화와 최신 동향',
    blurb:
      '교과서 바깥의 현재. tree-sitter의 점진적 GLR 파싱, PEG, ALL(*), MLIR, 검증된 컴파일러, 그리고 LLM이 실제로 파고든 지점.',
    chapters: [
      {label: '최신 경향과 연구', to: '/docs/modern/trends'},
      {label: '도구 지형도', to: '/docs/modern/toolchain-map'},
    ],
  },
];

export default function HomepageRoadmap(): ReactNode {
  return (
    <section className={styles.roadmap}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          학습 로드맵
        </Heading>
        <p className={styles.sectionLead}>
          앞 단계가 뒤 단계의 재료가 되도록 배치했다. 정규 표현 →{' '}
          <abbr title="Nondeterministic Finite Automaton">NFA</abbr> →{' '}
          <abbr title="Deterministic Finite Automaton">DFA</abbr> → lex,
          그리고 CFG → 항목 집합 → LR 표 → yacc 로 이어진다.
        </p>

        <ol className={styles.stopList}>
          {ROADMAP.map((stop) => (
            <li key={stop.part} className={styles.stop}>
              <div className={styles.stopHead}>
                <span className={styles.stopBadge}>{stop.part}</span>
                <Heading as="h3" className={styles.stopTitle}>
                  {stop.title}
                </Heading>
              </div>
              <p className={styles.stopBlurb}>{stop.blurb}</p>
              <ul className={styles.chapterList}>
                {stop.chapters.map((chapter) => (
                  <li key={chapter.to}>
                    <Link className={styles.chapterLink} to={chapter.to}>
                      {chapter.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
