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
  ],

  labSidebar: ['labs/setup'],
};

export default sidebars;
