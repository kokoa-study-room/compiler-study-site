import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const GITHUB_REPO = 'https://github.com/your-org/compiler-study-site';

const config: Config = {
  title: '컴파일러 학습 노트',
  tagline: '정규문법부터 LR 파서까지 — 이론과 lex/yacc 실습으로 완성하는 컴파일러 프론트엔드',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://compiler-study.example.com',
  baseUrl: '/',

  organizationName: 'compiler-study',
  projectName: 'compiler-study-site',

  // 집필이 진행 중인 동안에는 아직 없는 뒷장으로의 링크를 허용한다.
  // 모든 파트가 채워진 뒤 'throw' 로 되돌려 최종 검증한다.
  onBrokenLinks: 'warn',
  onBrokenAnchors: 'warn',

  i18n: {
    defaultLocale: 'ko',
    locales: ['ko'],
    localeConfigs: {
      ko: {
        label: '한국어',
        direction: 'ltr',
        htmlLang: 'ko-KR',
      },
    },
  },

  markdown: {
    mermaid: true,
    // 교안 본문에는 `{a, b}`, `<expr>`, `S → αβ` 같은 표기가 끊임없이 등장한다.
    // 이들이 MDX의 JSX 표현식으로 해석되면 빌드가 깨지므로,
    // .md 는 CommonMark 로, React 컴포넌트가 필요한 페이지만 .mdx 로 다룬다.
    format: 'detect',
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          editUrl: `${GITHUB_REPO}/tree/main/site/`,
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
          showLastUpdateTime: true,
        },
        blog: {
          path: 'blog',
          routeBasePath: 'log',
          blogTitle: '개발 로그',
          blogDescription: '이 사이트를 만들어 가는 과정의 작업 단위별 기록',
          blogSidebarTitle: '전체 기록',
          blogSidebarCount: 'ALL',
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: `${GITHUB_REPO}/tree/main/site/`,
          onInlineTags: 'warn',
          onInlineAuthors: 'ignore',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: false,
      },
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
    navbar: {
      title: '컴파일러 학습 노트',
      logo: {
        alt: '컴파일러 학습 노트 로고',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'courseSidebar',
          position: 'left',
          label: '교안',
        },
        {
          type: 'docSidebar',
          sidebarId: 'labSidebar',
          position: 'left',
          label: '실습',
        },
        {to: '/log', label: '개발 로그', position: 'left'},
        {
          type: 'search',
          position: 'right',
        },
        {
          href: GITHUB_REPO,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '교안',
          items: [
            {label: '들어가며', to: '/docs/intro'},
            {label: '컴파일러 개요', to: '/docs/foundations/compiler-overview'},
          ],
        },
        {
          title: '더 보기',
          items: [
            {label: '개발 로그', to: '/log'},
            {label: 'GitHub', href: GITHUB_REPO},
          ],
        },
      ],
      copyright: `컴파일러 학습 노트 · Docusaurus로 제작 · ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: [
        'c',
        'bash',
        'makefile',
        'json',
        'ebnf',
        'antlr4',
        'regex',
        'llvm',
      ],
      magicComments: [
        {
          className: 'theme-code-block-highlighted-line',
          line: 'highlight-next-line',
          block: {start: 'highlight-start', end: 'highlight-end'},
        },
        {
          className: 'code-block-error-line',
          line: 'error-next-line',
          block: {start: 'error-start', end: 'error-end'},
        },
      ],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
