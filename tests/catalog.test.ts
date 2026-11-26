import { describe, expect, it } from "vitest";
import { PACKS } from "../src/catalog";

describe("PACKS", () => {
  it("第一批正好十包", () => {
    expect(PACKS.map((pack) => pack.name)).toEqual([
      "丹青", "岁华", "十二辰", "山海", "未眠", "铁衣", "红氍", "檐滴", "玄海", "群芳",
    ]);
  });

  it("丹青的金卡和闪卡对上原作", () => {
    const paint = PACKS.find((pack) => pack.id === "danqing")!;
    expect(paint.cards.filter((c) => c.rarity === "gold").map((c) => c.name)).toEqual([
      "清明上河", "千里江山",
    ]);
    expect(paint.cards.filter((c) => c.rarity === "flash").map((c) => c.name)).toEqual([
      "群虾", "洛神",
    ]);
    expect(paint.cards).toHaveLength(28);
  });

  it("每包都有金卡和至少两张闪卡，普通数量最多", () => {
    for (const pack of PACKS) {
      const count = (rarity: string) => pack.cards.filter((c) => c.rarity === rarity).length;
      expect(count("gold")).toBeGreaterThanOrEqual(1);
      expect(count("flash")).toBeGreaterThanOrEqual(2);
      expect(count("common")).toBeGreaterThan(count("rare"));
      expect(new Set(pack.cards.map((c) => c.id)).size).toBe(pack.cards.length);
    }
  });
});
