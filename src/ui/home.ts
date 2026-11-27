import { mountPackPortrait } from "../view3d";
import { el, mountDesk } from "./chrome";

export type HomeInput = {
  total: number;
  coverUrl: string | null;
  onHome: () => void;
};

// 首页三件物品各去一个页面
export function renderHome(parent: HTMLElement, input: HomeInput): () => void {
  const body = mountDesk(parent, { coin: true, onHome: input.onHome });
  const row = el("div", "home-row");
  const album = el("a", "book");
  album.href = "#/dex";
  album.setAttribute("aria-label", "图鉴");
  const pack = el("a", "pack-slot");
  pack.href = "#/open";
  pack.setAttribute("aria-label", "拆卡");
  const count = el("span", "pack-count", String(input.total));
  pack.append(count);
  const tray = el("a", "tray");
  tray.href = "#/shop";
  tray.setAttribute("aria-label", "商店");
  row.append(album, pack, tray);
  body.append(row);
  if (!input.coverUrl) return () => {};
  const view = el("div", "stage-view");
  view.style.position = "absolute";
  view.style.inset = "0";
  pack.append(view);
  return mountPackPortrait(view, input.coverUrl);
}
