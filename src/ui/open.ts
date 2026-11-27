export type OpenModeKind = "pick" | "sealed" | "show" | "bare";
export type OpenPrompt = "none" | "unready" | "shop" | "next";

export type PromptView = {
  line: string | null;
  next: boolean;
  shop: boolean;
};

// 决定拆卡台上该出现下一包、去商店，还是什么都没有
export function openPrompt(
  mode: OpenModeKind,
  showDone: boolean,
  heldReady: number,
  heldUnready: boolean,
): OpenPrompt {
  if (mode === "pick") {
    if (heldReady > 0) return "none";
    if (heldUnready) return "unready";
    return "shop";
  }
  if (mode === "show") return showDone ? "next" : "none";
  if (mode === "bare") return "shop";
  return "none";
}

// 把上一函数的结果写成可见的句子和按钮
export function promptView(mode: OpenModeKind, prompt: OpenPrompt): PromptView {
  if (prompt === "next") return { line: null, next: true, shop: false };
  if (prompt === "unready") return { line: "图还没齐", next: false, shop: false };
  if (prompt === "shop" && mode === "pick") {
    return { line: "没有可拆的袋子", next: false, shop: true };
  }
  if (prompt === "shop") return { line: null, next: false, shop: true };
  return { line: null, next: false, shop: false };
}