import { describe, expect, it } from "vitest";
import { buildSlotResearchPrompt } from "../../src/prompts/slotResearchPrompt";

describe("buildSlotResearchPrompt", () => {
  it("デッキ内の全駒名を代用候補として提案しないよう明記する", () => {
    const prompt = buildSlotResearchPrompt("テストデッキ", [{ pieceName: "駒B" }], ["駒A", "駒B", "駒C"]);
    expect(prompt).toContain("駒A");
    expect(prompt).toContain("駒B");
    expect(prompt).toContain("駒C");
    expect(prompt).toContain("代用候補として提案しないでください");
  });

  it("調査対象の駒名も含める", () => {
    const prompt = buildSlotResearchPrompt("テストデッキ", [{ pieceName: "駒B" }, { pieceName: "駒C" }], ["駒A", "駒B", "駒C"]);
    expect(prompt).toContain("対象駒");
    expect(prompt).toMatch(/- 駒B/);
    expect(prompt).toMatch(/- 駒C/);
  });
});
