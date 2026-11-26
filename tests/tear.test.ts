import { describe, expect, it } from "vitest";
import { isOpened, tearProgress } from "../src/tear";

describe("tearProgress", () => {
  it("只认向右的拖动，超过轨道就停在 1", () => {
    expect(tearProgress(0, 100)).toBe(0);
    expect(tearProgress(-20, 100)).toBe(0);
    expect(tearProgress(50, 100)).toBe(0.5);
    expect(tearProgress(140, 100)).toBe(1);
  });

  it("未到三分之二不算打开", () => {
    expect(isOpened(0.66)).toBe(false);
    expect(isOpened(2 / 3)).toBe(true);
  });
});