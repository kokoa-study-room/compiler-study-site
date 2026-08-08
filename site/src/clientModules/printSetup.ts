/**
 * 인쇄할 때 접이식 풀이를 전부 펼친다.
 *
 * 확인 문제 125개의 풀이가 전부 `<details>` 안에 있다.
 * 닫힌 `<details>` 는 `<summary>` 만 인쇄되므로, 그대로 두면
 * **종이에는 풀이가 한 줄도 나오지 않는다.**
 *
 * CSS 로도 시도할 수 있지만(`details > *:not(summary) { display: revert }`)
 * 닫힌 `<details>` 의 내용을 감추는 방식이 브라우저마다 달라서 확실하지 않다.
 * 인쇄 직전에 `open` 을 켜고 끝나면 되돌리는 쪽이 어디서나 동작한다.
 *
 * 원래 열려 있던 것은 기억해 두었다가 그대로 둔다 —
 * 인쇄했다고 화면 상태가 바뀌면 안 된다.
 */

let wasOpen: WeakSet<HTMLDetailsElement> | null = null;

function openAll(): void {
  wasOpen = new WeakSet();
  document.querySelectorAll('details').forEach((el) => {
    if (el.open) {
      wasOpen!.add(el);
    } else {
      el.open = true;
    }
  });
}

function restore(): void {
  if (!wasOpen) return;
  document.querySelectorAll('details').forEach((el) => {
    if (!wasOpen!.has(el)) el.open = false;
  });
  wasOpen = null;
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeprint', openAll);
  window.addEventListener('afterprint', restore);

  // Safari 는 beforeprint 를 늦게 지원했다. matchMedia 로도 함께 건다.
  const mql = window.matchMedia?.('print');
  mql?.addEventListener?.('change', (e) => (e.matches ? openAll() : restore()));
}

export {};
