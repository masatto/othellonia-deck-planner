import { describe, expect, it } from "vitest";
import { buildTrackedDeckFromCandidate } from "../../src/domain/deckBuilder";
import type { DeckCandidate } from "../../src/prompts/deckSearchSchema";

const candidate: DeckCandidate = {
  deckName: "テストデッキ",
  concept: "コンセプト",
  pieces: ["駒A", "駒B", "駒C"],
  sourceUrl: "https://example.com",
  sourceTitle: "サイト",
};

describe("buildTrackedDeckFromCandidate", () => {
  it("各駒名を未所持のスロットとして展開する", () => {
    const now = "2026-09-15T00:00:00.000Z";
    const deck = buildTrackedDeckFromCandidate(candidate, "2026-09-14", now);
    expect(deck.deckName).toBe("テストデッキ");
    expect(deck.checkedAt).toBe("2026-09-14");
    expect(deck.slots).toHaveLength(3);
    for (const slot of deck.slots) {
      expect(slot.owned).toBe(false);
      expect(slot.substituteNote).toBeNull();
      expect(slot.acquisitionNote).toBeNull();
    }
    expect(deck.slots.map((s) => s.pieceName)).toEqual(["駒A", "駒B", "駒C"]);
  });

  it("deckId・slotIdは呼び出しごとに一意になる", () => {
    const now = "2026-09-15T00:00:00.000Z";
    const deck1 = buildTrackedDeckFromCandidate(candidate, "2026-09-14", now);
    const deck2 = buildTrackedDeckFromCandidate(candidate, "2026-09-14", now);
    expect(deck1.deckId).not.toBe(deck2.deckId);
    expect(deck1.slots[0].slotId).not.toBe(deck2.slots[0].slotId);
  });
});
