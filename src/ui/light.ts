import type { Rarity } from "../odds";

export type LightLayer = "sweep" | "rim" | "sparks" | "prism" | "hold";

// 翻面到落下这一段要亮的层
export function lightLayers(rarity: Rarity): LightLayer[] {
  if (rarity === "common") return ["sweep"];
  if (rarity === "rare") return ["sweep", "rim"];
  if (rarity === "super") return ["sweep", "rim", "sparks"];
  if (rarity === "flash") return ["prism", "rim", "sparks"];
  return ["prism", "sparks", "hold"];
}

// 落下之后还留着的层
export function settledLayers(rarity: Rarity): LightLayer[] {
  if (rarity === "flash") return ["prism", "sparks"];
  if (rarity === "gold") return ["prism", "sparks", "hold"];
  return [];
}

// 落下优先于翻面；两段都不是就熄灭
export function cardLayers(rarity: Rarity, beating: boolean, landed: boolean): LightLayer[] {
  if (landed) return settledLayers(rarity);
  if (beating) return lightLayers(rarity);
  return [];
}