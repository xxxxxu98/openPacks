import { el } from "./chrome";

export type ContentsInput = {
  title: string;
  tiers: { label: string; cards: { id: string; name: string; owned: number; url: string | null }[] }[];
  onClose: () => void;
  onInspect: (id: string) => void;
};
export type InspectInput = {
  name: string;
  meta: string;
  hold: string;
  onClose: () => void;
};

// 按稀有度列出这一包卖什么。没获得的名字不能点开
export function renderContents(parent: HTMLElement, input: ContentsInput): void {
  const layer = el("div", "overlay contents");
  layer.addEventListener("click", (event) => {
    if (event.target === layer) input.onClose();
  });
  layer.append(el("h2", "contents-title", input.title));
  for (const tier of input.tiers) {
    layer.append(el("h3", "", tier.label));
    const grid = el("div", "card-grid");
    for (const card of tier.cards) {
      const owned = card.owned > 0;
      const item = el(owned ? "button" : "div", "pack-card");
      if (item instanceof HTMLButtonElement) {
        item.type = "button";
        item.addEventListener("click", () => input.onInspect(card.id));
      }
      if (card.url) {
        const img = el("img");
        img.src = card.url;
        img.alt = owned ? card.name : "";
        item.append(img);
      } else item.append(el("span", "pack-card-blank"));
      item.append(el("span", "", card.name));
      grid.append(item);
    }
    layer.append(grid);
  }
  parent.append(layer);
}

// 近看时卡立在左边，右边只留名字、等级和持有
export function renderInspect(parent: HTMLElement, input: InspectInput): HTMLElement {
  const layer = el("div", "overlay inspect");
  layer.addEventListener("click", (event) => {
    if (event.target === layer) input.onClose();
  });
  const view = el("div", "inspect-view");
  const side = el("aside", "inspect-side");
  side.append(el("h2", "", input.name), el("p", "", input.meta), el("p", "", input.hold));
  side.append(el("p", "hint", "拖动旋转，滚轮缩放"));
  layer.append(view, side);
  parent.append(layer);
  return view;
}
