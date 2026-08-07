import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';
import HomepageRoadmap from '@site/src/components/HomepageRoadmap';

import styles from './index.module.css';

const PIPELINE = [
  {stage: '소스', detail: 'int x = a + 3 * b;'},
  {stage: '어휘 분석', detail: 'INT ID(x) ASSIGN ID(a) PLUS NUM(3) …'},
  {stage: '구문 분석', detail: '파스 트리 / AST'},
  {stage: '의미 분석', detail: '타입 검사 · 심볼 테이블'},
  {stage: '중간 코드', detail: '3-주소 코드'},
  {stage: '목적 코드', detail: '어셈블리 / 기계어'},
];

const SAMPLE = `%{
#include "y.tab.h"
%}

digit   [0-9]
letter  [A-Za-z_]

%%
"if"                    { return IF;  }
"else"                  { return ELSE; }
{letter}({letter}|{digit})*  { yylval.str = strdup(yytext); return ID; }
{digit}+                { yylval.num = atoi(yytext); return NUM; }
[ \\t\\n]+               { /* 공백은 버린다 */ }
.                       { return yytext[0]; }
%%`;

function Hero(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.hero)}>
      <div className={clsx('container', styles.heroInner)}>
        <div className={styles.heroCopy}>
          <Heading as="h1" className={styles.heroTitle}>
            {siteConfig.title}
          </Heading>
          <p className={styles.heroTagline}>
            고급 언어 프로그램을 기계어나 어셈블리어로 번역하는 소프트웨어를
            직접 만들어 보는 교안입니다. 정규 문법·문맥 자유 문법·
            <abbr title="Finite Automata">유한 오토마타</abbr>·
            <abbr title="Pushdown Automata">푸시다운 오토마타</abbr>{' '}
            같은 이론을 세운 다음, <code>lex</code>와 <code>yacc</code>로
            그 이론을 그대로 코드로 옮깁니다.
          </p>
          <div className={styles.heroButtons}>
            <Link className="button button--primary button--lg" to="/docs/intro">
              교안 시작하기
            </Link>
            <Link
              className="button button--secondary button--lg"
              to="/docs/labs/setup">
              실습 환경 구성
            </Link>
          </div>
        </div>

        <div className={styles.heroSample}>
          <div className={styles.heroSampleLabel}>scanner.l</div>
          <CodeBlock language="c" className={styles.heroSampleCode}>
            {SAMPLE}
          </CodeBlock>
        </div>
      </div>
    </header>
  );
}

function Pipeline(): ReactNode {
  return (
    <section className={styles.pipelineSection}>
      <div className="container">
        <Heading as="h2" className={styles.pipelineTitle}>
          이 교안이 다루는 범위
        </Heading>
        <p className={styles.pipelineLead}>
          컴파일러 전체 파이프라인 중 <strong>어휘 분석과 구문 분석</strong>,
          즉 프론트엔드를 깊게 파고듭니다. 뒤쪽 단계는 전체 그림을 잃지 않을
          만큼만 다룹니다.
        </p>
        <ol className={styles.pipeline}>
          {PIPELINE.map((step, i) => (
            <li
              key={step.stage}
              className={clsx(styles.pipelineStep, {
                [styles.pipelineStepFocus]: i === 1 || i === 2,
              })}>
              <span className={styles.pipelineStage}>{step.stage}</span>
              <code className={styles.pipelineDetail}>{step.detail}</code>
            </li>
          ))}
        </ol>
        <p className={styles.pipelineNote}>
          강조된 두 단계가 이 교안의 본체입니다.
        </p>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title="홈" description={siteConfig.tagline}>
      <Hero />
      <main>
        <Pipeline />
        <HomepageRoadmap />
      </main>
    </Layout>
  );
}
