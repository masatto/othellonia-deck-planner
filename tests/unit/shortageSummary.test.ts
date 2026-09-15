import { describe, expect, it } from "vitest";
import { summarizeShortages } from "../../src/domain/shortageSummary";
import type { DeckSlot, TrackedDeck } from "../../src/domain/types";

function makeSlot(pieceName: string, overrides: Partial<DeckSlot> = {}): DeckSlot {
  return {
    slotId: `slot-${pieceName}`,
    pieceName,
    owned: false,
    acquisitionNote: null,
    substitutes: [],
    updatedAt: "2026-09-15T00:00:00.000Z",
    ...overrides,
  };
}

function makeDeck(deckId: string, deckName: string, slots: DeckSlot[]): TrackedDeck {
  return {
    deckId,
    deckName,
    concept: null,
    sourceUrl: null,
    sourceTitle: null,
    checkedAt: null,
    slots,
    createdAt: "2026-09-15T00:00:00.000Z",
    updatedAt: "2026-09-15T00:00:00.000Z",
  };
}

describe("summarizeShortages", () => {
  it("複数デッキで必要とされている駒ほど上位に来る", () => {
    const decks = [
      makeDeck("d1", "デッキ1", [makeSlot("駒A"), makeSlot("駒B")]),
      makeDeck("d2", "デッキ2", [makeSlot("駒A"), makeSlot("駒C")]),
      makeDeck("d3", "デッキ3", [makeSlot("駒A")]),
    ];
    const result = summarizeShortages(decks);
    expect(result[0].pieceName).toBe("駒A");
    expect(result[0].neededByDecks).toHaveLength(3);
    expect(result[0].neededByDecks.map((d) => d.deckId).sort()).toEqual(["d1", "d2", "d3"]);
  });

  it("所持済みのスロットは集計対象にならない", () => {
    const decks = [makeDeck("d1", "デッキ1", [makeSlot("駒A", { owned: true })])];
    const result = summarizeShortages(decks);
    expect(result).toHaveLength(0);
  });

  it("代用候補を所持している場合も集計対象にならない（代用で対応可能なため）", () => {
    const decks = [
      makeDeck("d1", "デッキ1", [
        makeSlot("駒A", {
          substitutes: [{ candidateId: "s1", name: "駒B", reason: null, acquisitionNote: null, owned: true, updatedAt: "2026-09-15T00:00:00.000Z" }],
        }),
      ]),
    ];
    const result = summarizeShortages(decks);
    expect(result).toHaveLength(0);
  });

  it("同じデッキ内に同名の駒が複数あっても、そのデッキは1回だけカウントする", () => {
    const decks = [makeDeck("d1", "デッキ1", [makeSlot("駒A"), makeSlot("駒A")])];
    const result = summarizeShortages(decks);
    expect(result).toHaveLength(1);
    expect(result[0].neededByDecks).toHaveLength(1);
  });

  it("デッキが無い場合は空配列を返す", () => {
    expect(summarizeShortages([])).toEqual([]);
  });
});
