import { describe, expect, it } from "vitest";
import { PACKS } from "../src/catalog";
import { packArtReady } from "../src/art";

describe("packArtReady", () => {
  it("袋面或任何一张卡缺图就不齐", () => {
    const pack = PACKS[0];
    const files = new Set([
      `packs/${pack.id}.webp`,
      ...pack.cards.map((c) => `cards/${pack.id}/${c.id}.webp`),
    ]);
    expect(packArtReady(pack, files)).toBe(true);
    files.delete(`cards/${pack.id}/${pack.cards[0].id}.webp`);
    expect(packArtReady(pack, files)).toBe(false);
  });
});
