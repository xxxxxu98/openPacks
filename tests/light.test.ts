import { describe, expect, it } from "vitest";
import { cardLayers, lightLayers, settledLayers } from "../src/ui/light";

describe("lightLayers", () => {
  it("普通只有扫光", () => {
    expect(lightLayers("common")).toEqual(["sweep"]);
  });

  it("稀有在扫光上加光边", () => {
    expect(lightLayers("rare")).toEqual(["sweep", "rim"]);
  });

  it("超稀有再加星点，扫光还在", () => {
    expect(lightLayers("super")).toEqual(["sweep", "rim", "sparks"]);
    expect(lightLayers("super")).toContain("sweep");
  });

  it("闪卡用棱镜换掉扫光", () => {
    expect(lightLayers("flash")).toEqual(["prism", "rim", "sparks"]);
    expect(lightLayers("flash")).not.toContain("sweep");
  });

  it("金卡是棱镜、星点和不灭的光边", () => {
    expect(lightLayers("gold")).toEqual(["prism", "sparks", "hold"]);
    expect(lightLayers("gold")).not.toContain("sweep");
  });
});

describe("settledLayers", () => {
  it("普通、稀有、超稀有落下后熄灭", () => {
    expect(settledLayers("common")).toEqual([]);
    expect(settledLayers("rare")).toEqual([]);
    expect(settledLayers("super")).toEqual([]);
  });

  it("闪卡留下棱镜和星点", () => {
    expect(settledLayers("flash")).toEqual(["prism", "sparks"]);
  });

  it("金卡的光边不灭", () => {
    expect(settledLayers("gold")).toEqual(["prism", "sparks", "hold"]);
  });
});

describe("cardLayers", () => {
  it("还没翻面时不亮", () => {
    expect(cardLayers("flash", false, false)).toEqual([]);
  });

  it("已经落下时用落下之后的那一列", () => {
    expect(cardLayers("gold", true, true)).toEqual(["prism", "sparks", "hold"]);
    expect(cardLayers("rare", true, true)).toEqual([]);
  });

  it("正在翻面时用翻面那一列", () => {
    expect(cardLayers("super", true, false)).toEqual(["sweep", "rim", "sparks"]);
  });
});