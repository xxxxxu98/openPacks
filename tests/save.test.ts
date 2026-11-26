import { describe, expect, it } from "vitest";
import { buyPack, commitOpen, equip, finishOpen, freshSave, loadSave } from "../src/save";

const five = [
  { id: "a", name: "甲" },
  { id: "b", name: "乙" },
  { id: "c", name: "丙" },
  { id: "d", name: "丁" },
  { id: "e", name: "戊" },
];

describe("save", () => {
  it("开局是未眠 3 袋，没有钱字段", () => {
    const save = freshSave();
    expect(save.packs.weimian).toBe(3);
    expect(save).not.toHaveProperty("money");
  });

  it("坏档回到开局", () => {
    expect(loadSave("not-json").packs.weimian).toBe(3);
  });

  it("撕开才扣袋，并记住这五张", () => {
    const opened = commitOpen(freshSave(), "weimian", five);
    expect(opened.packs.weimian).toBe(2);
    expect(opened.current?.cards.map((c) => c.id)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("写入图鉴后当前包清空，重复张数加一", () => {
    const done = finishOpen(commitOpen(freshSave(), "weimian", five));
    expect(done.current).toBeNull();
    expect(done.owned.a).toBe(1);
    const again = finishOpen(commitOpen(done, "weimian", five));
    expect(again.owned.a).toBe(2);
  });

  it("买包只加数量。已有装饰再点只切换", () => {
    const bought = buyPack(freshSave(), "danqing");
    expect(bought.packs.danqing).toBe(1);
    const equipped = equip(equip(bought, "sleeve", "plain"), "sleeve", "plain");
    expect(equipped.equipped.sleeve).toBe("plain");
  });
});