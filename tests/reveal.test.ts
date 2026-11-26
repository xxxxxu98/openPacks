import { describe, expect, it } from "vitest";
import { advance, cardBeat, initialReveal } from "../src/reveal";

describe("cardBeat", () => {
  it("金卡比普通卡多 0.8 秒停顿", () => {
    expect(cardBeat("gold") - cardBeat("common")).toBe(800);
    expect(cardBeat("rare") - cardBeat("common")).toBe(300);
  });
});

describe("advance", () => {
  it("五张普通卡的演出长于收口和空拍", () => {
    let state = initialReveal(["common", "common", "common", "common", "common"]);
    state = advance(state, 600);
    expect(state.phase).toBe("hold");
    state = advance(state, 400);
    expect(state.phase).toBe("card");
    expect(state.cardIndex).toBe(0);
  });
});