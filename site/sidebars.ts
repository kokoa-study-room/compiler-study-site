import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * 교안 사이드바는 강의 순서를 그대로 따른다.
 *
 *   1부 기초        컴파일러 개요 · 언어와 문법
 *   2부 정규언어    정규언어 · 정규 표현 · 유한 오토마타 · 정규언어의 표현 방법
 *   3부 LEX         LEX · LEX 입력 및 파싱 · LEX 입력 파일 작성
 *   4부 구문 분석   문맥 자유 문법 · 문법의 유형 · 구문 분석 · LL · LR · LR 파서 구현
 *   5부 YACC        YACC 개요 · 문법과 액션 · 충돌과 우선순위
 *   6부 심화        최신 경향과 연구 · 도구 지형도
 *
 * 각 부는 완성되는 대로 이 파일에 추가한다(사이트가 항상 빌드되는 상태를 유지).
 */
const sidebars: SidebarsConfig = {
  courseSidebar: [
    'intro',
    {
      type: 'category',
      label: '1부 · 기초',
      collapsed: false,
      link: {
        type: 'generated-index',
        title: '1부 · 기초',
        description:
          '컴파일러가 무엇을 하는 소프트웨어인지, 그리고 그 전 과정을 떠받치는 "언어와 문법"이라는 형식 도구를 먼저 세운다.',
        slug: '/category/foundations',
      },
      items: [
        'foundations/compiler-overview',
        'foundations/language-and-grammar',
      ],
    },
    {
      type: 'category',
      label: '2부 · 정규언어와 유한 오토마타',
      collapsed: false,
      link: {
        type: 'generated-index',
        title: '2부 · 정규언어와 유한 오토마타',
        description:
          '어휘 분석기의 이론적 토대. 정규언어를 정의하고, 정규 표현과 유한 오토마타가 같은 표현력을 가진다는 사실과 그 상호 변환을 다룬다.',
        slug: '/category/regular',
      },
      items: [
        'regular/regular-languages',
        'regular/regular-expressions',
        'regular/finite-automata',
        'regular/representations',
      ],
    },
    {
      type: 'category',
      label: '3부 · LEX',
      collapsed: false,
      link: {
        type: 'generated-index',
        title: '3부 · LEX',
        description:
          '2부의 이론을 자동화한 도구. lex/flex가 정규 표현으로부터 어떻게 DFA를 만들고 토큰을 잘라내는지, 그리고 입력 파일을 어떻게 쓰는지 다룬다.',
        slug: '/category/lex',
      },
      items: [
        'lex/lex-overview',
        'lex/lex-input-and-parsing',
        'lex/writing-lex-files',
      ],
    },
  ],

  labSidebar: [
    'labs/setup',
    {
      type: 'category',
      label: '실습 과제',
      collapsed: false,
      link: {
        type: 'generated-index',
        title: '실습 과제',
        description:
          'flex와 bison을 직접 돌려 보는 과제 모음. 모든 예제는 저장소의 examples/ 아래에 실행 가능한 형태로 들어 있다.',
        slug: '/category/labs',
      },
      items: ['labs/lex-labs'],
    },
  ],
};

export default sidebars;
