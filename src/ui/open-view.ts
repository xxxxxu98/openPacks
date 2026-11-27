import { mountPackPortrait } from "../view3d";
import { el, mountDesk } from "./chrome";
import { promptView, type OpenModeKind, type OpenPrompt } from "./open";

export type OpenPack = { id: string; name: string; held: number; coverUrl: string | null };
export type OpenMount = {
  stageHost: HTMLElement | null;
  nextButton: HTMLButtonElement | null;
  stop: () => void;
};
export type OpenViewInput = {
  mode: OpenModeKind;
  packs: OpenPack[];
  selectedId: string | null;
  prompt: OpenPrompt;
  onHome: () => void;
  onSelect: (id: string) => void;
  onTear: (id: string) => void;
  onContents: (id: string) => void;
  onNext: () => void;
};

// 选包时摆袋子；撕和播时把三维桌子交给 main
export function renderOpen(parent: HTMLElement, input: OpenViewInput): OpenMount {
  const stops: Array<() => void> = [];
  const body = mountDesk(parent, { coin: false, onHome: input.onHome });
  let stageHost: HTMLElement | null = null;
  if (input.mode === "pick") {
    const row = el("div", "open-bags");
    for (const pack of input.packs) {
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
      glass.append(el("strong", "", pack.name), el("span", "", `${pack.held} 袋`));
      const tear = el("button", "pill", "拆开");
      tear.type = "button";
      tear.addEventListener("click", () => input.onTear(pack.id));
      const look = el("button", "pill", "卡牌");
      look.type = "button";
      look.addEventListener("click", () => input.onContents(pack.id));
      glass.append(tear, look);
      row.append(glass);
    }
    body.append(row);
  }
  if (input.mode === "sealed" || input.mode === "show") {
    const host = el("div", "stage-host");
    const view = el("div", "stage-view");
    const hit = el("div", "stage-hit");
    hit.setAttribute("aria-label", "撕口");
    if (input.mode !== "sealed") hit.style.pointerEvents = "none";
    host.append(view, hit);
    body.append(host);
    stageHost = view;
  }
  const prompt = el("div", "prompt");
  const view = promptView(input.mode, input.prompt);
  if (view.line) prompt.append(el("p", "", view.line));
  let nextButton: HTMLButtonElement | null = null;
  if (input.mode === "show") {
    nextButton = el("button", "pill", "下一包");
    nextButton.type = "button";
    nextButton.hidden = !view.next;
    nextButton.addEventListener("click", input.onNext);
    prompt.append(nextButton);
  }
  if (view.shop) {
    const shop = el("a", "pill", "去商店");
    shop.href = "#/shop";
    prompt.append(shop);
  }
  body.append(prompt);
  return {
    stageHost,
    nextButton,
    stop: () => {
      for (const stop of stops) stop();
    },
  };
}
