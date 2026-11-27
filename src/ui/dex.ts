import type { Rarity } from "../odds";
import { el, mountDesk } from "./chrome";

export type DexInput = {
  packs: { id: string; name: string }[];
  packId: string;
  rarity: Rarity;
  cards: { id: string; name: string; owned: number; url: string | null }[];
  onHome: () => void;
  onPack: (id: string) => void;
  onRarity: (rarity: Rarity) => void;
  onInspect: (id: string) => void;
};

const TABS: { id: Rarity; label: string }[] = [
  { id: "gold", label: "金卡" },
  { id: "flash", label: "闪卡" },
  { id: "super", label: "超稀有" },
  { id: "rare", label: "稀有" },
  { id: "common", label: "普通" },
];

// 一次摊开一包，没拆到的只留剪影
export function renderDex(parent: HTMLElement, input: DexInput): void {
  const body = mountDesk(parent, { coin: false, onHome: input.onHome });
  const spread = el("div", "spread");
  const spine = el("div", "spine");
  for (const pack of input.packs) {
    const button = el("button", pack.id === input.packId ? "spine-btn on" : "spine-btn", pack.name);
    button.type = "button";
    button.addEventListener("click", () => input.onPack(pack.id));
    spine.append(button);
  }
  const page = el("div", "page");
  const index = el("div", "index");
  for (const tab of TABS) {
    const button = el("button", tab.id === input.rarity ? "index-btn on" : "index-btn", tab.label);
    button.type = "button";
    button.addEventListener("click", () => input.onRarity(tab.id));
    index.append(button);
  }
  const cells = el("div", "cells");
  for (const card of input.cards) {
    if (card.owned <= 0) {
      cells.append(el("span", "cell ghost"));
      continue;
    }
    const slot = el("button", "cell");
    slot.type = "button";
    slot.addEventListener("click", () => input.onInspect(card.id));
    if (card.url) {
      const img = el("img");
      img.src = card.url;
      img.alt = card.name;
      slot.append(img);
    }
    slot.append(el("span", "cell-count", String(card.owned)));
    cells.append(slot);
  }
  page.append(index, cells);
  spread.append(spine, page);
  body.append(spread);
}
