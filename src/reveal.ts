import type { Rarity } from "./odds";

export const PAUSE: Record<Rarity, number> = {
  common: 0,
  rare: 300,
  super: 450,
  flash: 600,
  gold: 800,
};

const FLOAT = 800;
const FLIP = 700;
const LAND = 500;
const GAP = 400;

/** 单张翻面演出总时长（飘出、停顿、翻面、落下、间隔）。 */
export function cardBeat(rarity: Rarity): number {
  return FLOAT + PAUSE[rarity] + FLIP + LAND + GAP;
}

export type RevealState = {
  rarities: Rarity[];
  phase: "settle" | "hold" | "card" | "done";
  cardIndex: number;
  elapsed: number;
};

/** 以收口阶段和首张索引初始化演出状态。 */
export function initialReveal(rarities: Rarity[]): RevealState {
  return { rarities, phase: "settle", cardIndex: 0, elapsed: 0 };
}

/** 按毫秒推进收口、空拍与逐张翻面阶段。 */
export function advance(state: RevealState, ms: number): RevealState {
  let next = { ...state, elapsed: state.elapsed + ms };
  if (next.phase === "settle" && next.elapsed >= 600) {
    next = { ...next, phase: "hold", elapsed: next.elapsed - 600 };
  }
  if (next.phase === "hold" && next.elapsed >= 400) {
    next = { ...next, phase: "card", elapsed: next.elapsed - 400, cardIndex: 0 };
  }
  while (next.phase === "card" && next.elapsed >= cardBeat(next.rarities[next.cardIndex])) {
    next = {
      ...next,
      elapsed: next.elapsed - cardBeat(next.rarities[next.cardIndex]),
      cardIndex: next.cardIndex + 1,
    };
    if (next.cardIndex >= next.rarities.length) next = { ...next, phase: "done" };
  }
  return next;
}