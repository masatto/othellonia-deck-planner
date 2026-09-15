import { describe, expect, it } from "vitest";
import { splitIntoBatches } from "../../src/prompts/batching";

describe("splitIntoBatches", () => {
  it("指定件数ごとに分割する", () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    const batches = splitIntoBatches(items, 8);
    expect(batches).toHaveLength(3);
    expect(batches[0]).toHaveLength(8);
    expect(batches[1]).toHaveLength(8);
    expect(batches[2]).toHaveLength(4);
  });

  it("件数が上限以下なら1バッチにまとまる", () => {
    const items = Array.from({ length: 5 }, (_, i) => i);
    const batches = splitIntoBatches(items, 8);
    expect(batches).toHaveLength(1);
  });

  it("空配列なら0バッチになる", () => {
    expect(splitIntoBatches([], 8)).toHaveLength(0);
  });

  it("batchSizeが0以下なら例外を投げる", () => {
    expect(() => splitIntoBatches([1, 2], 0)).toThrow();
  });
});
