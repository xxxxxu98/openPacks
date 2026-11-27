import { describe, expect, it } from "vitest";
import { openPrompt, promptView } from "../src/ui/open";

describe("openPrompt", () => {
  it("还有可拆的包时不写字", () => {
    expect(openPrompt("pick", false, 2, true)).toBe("none");
  });

  it("手里有袋子但图没齐", () => {
    expect(openPrompt("pick", false, 0, true)).toBe("unready");
  });

  it("一只可展示的袋子都没有", () => {
    expect(openPrompt("pick", false, 0, false)).toBe("shop");
  });

  it("撕开和播出的过程中没有字", () => {
    expect(openPrompt("sealed", false, 1, false)).toBe("none");
    expect(openPrompt("show", false, 1, false)).toBe("none");
  });

  it("五张落完、还没按下一包", () => {
    expect(openPrompt("show", true, 0, false)).toBe("next");
  });

  it("按下下一包后这一包没有了", () => {
    expect(openPrompt("bare", false, 0, false)).toBe("shop");
  });
});

describe("promptView", () => {
  it("图没齐只有那一句，没有去商店", () => {
    expect(promptView("pick", "unready")).toEqual({ line: "图还没齐", next: false, shop: false });
  });

  it("选包页没有袋子时两样都有", () => {
    expect(promptView("pick", "shop")).toEqual({
      line: "没有可拆的袋子",
      next: false,
      shop: true,
    });
  });

  it("刚拆完的空桌只显示去商店", () => {
    expect(promptView("bare", "shop")).toEqual({ line: null, next: false, shop: true });
  });

  it("下一包不是一句说明", () => {
    expect(promptView("show", "next")).toEqual({ line: null, next: true, shop: false });
  });
});