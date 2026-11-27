export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// 铺一张白场，底边一条台沿，需要时在角上放 ∞
export function mountDesk(
  parent: HTMLElement,
  opts: { coin: boolean; onHome: () => void },
): HTMLElement {
  const desk = el("div", "desk");
  if (opts.coin) {
    const coin = el("p", "coin", "∞");
    coin.setAttribute("aria-label", "金币");
    desk.append(coin);
  }
  const body = el("div", "desk-body");
  const lip = el("button", "lip");
  lip.type = "button";
  lip.setAttribute("aria-label", "回首页");
  lip.addEventListener("click", (event) => {
    event.stopPropagation();
    opts.onHome();
  });
  desk.append(body, lip);
  parent.append(desk);
  return body;
}