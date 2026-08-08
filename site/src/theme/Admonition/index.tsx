import React, {type ReactElement, type ReactNode} from 'react';
import {processAdmonitionProps} from '@docusaurus/theme-common';
import AdmonitionTypes from '@theme/Admonition/Types';
import type {Props} from '@theme/Admonition';

/**
 * admonition 제목에 서식이 들어 있을 때 제목이 통째로 버려지는 문제를 고친다.
 *
 * ```md
 * :::caution[`ab*` 와 `(ab)*` 는 완전히 다르다]
 * ```
 *
 * 이 제목은 백틱 때문에 순수 문자열이 아니다.
 * 그래서 remark 는 제목을 `mdxAdmonitionTitle` 이라는 요소로 감싸 본문 앞에 넣고,
 * 테마가 그것을 찾아 제목 자리로 끌어올리는 방식으로 처리한다.
 *
 * **그런데 `.md`(CommonMark) 파일에서는 그 요소 이름이 소문자로 내려온다.**
 * 테마의 `processAdmonitionProps` 는 camelCase 로만 찾으므로 못 찾고,
 * 결과적으로
 *
 *   - 제목 자리에는 기본 라벨("주의", "정보" …)이 나오고
 *   - 제목 글은 본문 첫 줄에 밋밋하게 붙는다
 *
 * 경고도 없고 빌드도 통과한다. 이 교안은
 * [`markdown.format: 'detect'`](../../../docusaurus.config.ts) 때문에
 * 대부분의 장이 `.md` 라서 39곳이 이 상태였다.
 *
 * 아래에서 소문자 이름까지 함께 찾아 끌어올린다.
 */
function hoistLowercaseTitle(props: Props): Props {
  const items = React.Children.toArray(props.children);
  const wrapper = items.find(
    (item) =>
      React.isValidElement(item) &&
      (item.type as unknown as string) === 'mdxadmonitiontitle',
  ) as ReactElement<{children?: ReactNode}> | undefined;

  if (!wrapper) {
    return props;
  }

  const rest = items.filter((item) => item !== wrapper);
  return {
    ...props,
    title: props.title ?? wrapper.props.children,
    children: <>{rest}</>,
  };
}

function getAdmonitionTypeComponent(type: string) {
  const component = AdmonitionTypes[type as keyof typeof AdmonitionTypes];
  if (component) {
    return component;
  }
  // eslint-disable-next-line no-console
  console.warn(
    `No admonition component found for admonition type "${type}". Using Info as fallback.`,
  );
  return AdmonitionTypes.info;
}

export default function Admonition(unprocessedProps: Props): ReactNode {
  const props = processAdmonitionProps(hoistLowercaseTitle(unprocessedProps));
  const AdmonitionTypeComponent = getAdmonitionTypeComponent(props.type);
  return <AdmonitionTypeComponent {...props} />;
}
