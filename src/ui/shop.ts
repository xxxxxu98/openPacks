import { mountPackPortrait } from "../view3d";
import { el, mountDesk } from "./chrome";

export type ShopPack = {
  id: string;
  name: string;
  seriesName: string;
  held: number;
  coverUrl: string | null;
};
export type ShopInput = {
  packs: ShopPack[];
  selectedId: string | null;
  cosmeticKind: "cover" | "sleeve" | "cloth" | null;
  cosmetics: { kind: "cover" | "sleeve" | "cloth"; id: string; on: boolean }[];
  onHome: () => void;
  onSelect: (id: string) => void;
  onBuy: (id: string) => void;
  onContents: (id: string) => void;
  onCosmeticKind: (kind: "cover" | "sleeve" | "cloth") => void;
  onEquip: (kind: "cover" | "sleeve" | "cloth", id: string) => void;
};

type CosmeticKind = "cover" | "sleeve" | "cloth";

// 给开局就有的装饰起页面上的名字
export function cosmeticLabel(kind: CosmeticKind, id: string): string {
  if (kind === "sleeve" && id === "plain") return "无卡套";
  if (kind === "cover" && id === "default") return "默认封面";
  if (kind === "cloth" && id === "default") return "默认桌布";
  return id;
}

// 图齐的袋子按系列站好，点中才出现购买
export function renderShop(parent: HTMLElement, input: ShopInput): () => void {
  const stops: Array<() => void> = [];
  const body = mountDesk(parent, { coin: true, onHome: input.onHome });
  const groups: { seriesName: string; packs: ShopPack[] }[] = [];
  for (const pack of input.packs) {
    const last = groups[groups.length - 1];
    if (last && last.seriesName === pack.seriesName) last.packs.push(pack);
    else groups.push({ seriesName: pack.seriesName, packs: [pack] });
  }
  for (const group of groups) {
    const only = group.packs.length === 1 ? group.packs[0] : undefined;
    if (!only || only.name !== group.seriesName) body.append(el("h2", "series-name", group.seriesName));
    const row = el("div", "shop-row");
    for (const pack of group.packs) {
      const selected = pack.id === input.selectedId;
      const slot = el("div", selected ? "pack-slot fore" : "pack-slot");
      const face = el("button", "pack-face");
      face.type = "button";
      face.addEventListener("click", () => input.onSelect(pack.id));
      if (pack.coverUrl) {
        const view = el("div", "stage-view");
        view.style.position = "absolute";
        view.style.inset = "0";
        face.append(view);
        stops.push(mountPackPortrait(view, pack.coverUrl));
      }
      slot.append(face);
      row.append(slot);
      if (!selected) continue;
      const glass = el("div", "glass");
      glass.append(el("strong", "", pack.name), el("span", "", `持有 ${pack.held}`));
      const buy = el("button", "pill", "买一袋");
      buy.type = "button";
      buy.addEventListener("click", () => input.onBuy(pack.id));
      const look = el("button", "pill", "卡牌");
      look.type = "button";
      look.addEventListener("click", () => input.onContents(pack.id));
      glass.append(buy, look);
      row.append(glass);
    }
    body.append(row);
  }
  const dots = el("div", "dots");
  const kinds: [CosmeticKind, string][] = [["cover", "封面"], ["sleeve", "卡套"], ["cloth", "桌布"]];
  for (const [kind, label] of kinds) {
    const dot = el("button", input.cosmeticKind === kind ? "dot on" : "dot");
    dot.type = "button";
    dot.dataset.kind = kind;
    dot.setAttribute("aria-label", label);
    dot.addEventListener("click", () => input.onCosmeticKind(kind));
    dots.append(dot);
  }
  body.append(dots);
  if (input.cosmeticKind) {
    const list = el("div", "cosmetic-list");
    for (const item of input.cosmetics) {
      if (item.kind !== input.cosmeticKind) continue;
      const row = el("button", "cosmetic");
      row.type = "button";
      row.addEventListener("click", () => input.onEquip(item.kind, item.id));
      row.append(el("span", "", cosmeticLabel(item.kind, item.id)));
      if (item.on) row.append(el("span", "using", "使用中"));
      list.append(row);
    }
    body.append(list);
  }
  return () => {
    for (const stop of stops) stop();
  };
}
