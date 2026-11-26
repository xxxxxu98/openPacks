import { describe, expect, it } from "vitest";
import { mulberry32, rollFive, withPreviewGold, type CardDef } from "../src/odds";

const pack: CardDef[] = [
  { id: "c1", name: "甲", rarity: "common" },
  { id: "c2", name: "乙", rarity: "common" },
  { id: "r1", name: "稀", rarity: "rare" },
  { id: "s1", name: "超", rarity: "super" },
  { id: "f1", name: "闪", rarity: "flash" },
  { id: "g1", name: "金", rarity: "gold" },
];

describe("rollFive", () => {
  it("一次抽出五张", () => {
    const drawn = rollFive(pack, mulberry32(1));
    expect(drawn).toHaveLength(5);
    for (const card of drawn) expect(pack.map((c) => c.id)).toContain(card.id);
  });

  it("同一种子两次结果相同", () => {
    expect(rollFive(pack, mulberry32(7))).toEqual(rollFive(pack, mulberry32(7)));
  });

  it("固定种子下金卡约占每次抽取的 0.05%", () => {
    const random = mulberry32(11);
    let gold = 0;
    const draws = 200_000;
    for (let i = 0; i < draws; i++) {
      if (rollFive(pack, random)[0].rarity === "gold") gold++;
    }
    expect(gold / draws).toBeGreaterThan(0.0002);
    expect(gold / draws).toBeLessThan(0.0009);
  });
});

describe("withPreviewGold", () => {
  it("五张里换成一张该包的金卡", () => {
    const drawn = Array.from({ length: 5 }, () => pack[0]);
    const next = withPreviewGold(drawn, pack);
    expect(next[0].id).toBe("g1");
    expect(next.slice(1).every((card) => card.rarity === "common")).toBe(true);
  });
});