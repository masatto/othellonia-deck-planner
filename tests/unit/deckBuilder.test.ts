import { describe, expect, it } from "vitest";
import { buildTrackedDeckFromCandidate, excludeDeckOwnPieces, mergeSubstituteCandidates, normalizeTrackedDeck } from "../../src/domain/deckBuilder";
import type { DeckCandidate } from "../../src/prompts/deckSearchSchema";
import type { TrackedDeck } from "../../src/domain/types";

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
      expect(slot.substitutes).toEqual([]);
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

describe("normalizeTrackedDeck", () => {
  it("substitutesを持たない旧形式のデッキを読み込んでも壊れない", () => {
    const legacyDeck = {
      deckId: "deck-1",
      deckName: "旧デッキ",
      concept: null,
      sourceUrl: null,
      sourceTitle: null,
      checkedAt: null,
      slots: [
        {
          slotId: "slot-1",
          pieceName: "駒A",
          owned: false,
          // substitutesが無い旧形式。substituteNoteのような旧フィールドが残っていてもよい
          substituteNote: "旧形式の自由記述メモ",
          acquisitionNote: null,
          updatedAt: "2026-09-14T00:00:00.000Z",
        },
      ],
      createdAt: "2026-09-14T00:00:00.000Z",
      updatedAt: "2026-09-14T00:00:00.000Z",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any as TrackedDeck;

    const normalized = normalizeTrackedDeck(legacyDeck);
    expect(normalized.slots[0].substitutes).toEqual([]);
    expect(normalized.slots[0].pieceName).toBe("駒A");
  });

  it("既にsubstitutesを持つデッキはそのまま維持する", () => {
    const now = "2026-09-15T00:00:00.000Z";
    const deck = buildTrackedDeckFromCandidate(candidate, "2026-09-14", now);
    const withSubstitute: TrackedDeck = {
      ...deck,
      slots: [{ ...deck.slots[0], substitutes: [{ candidateId: "sub-1", name: "駒D", reason: null, acquisitionNote: null, owned: true, updatedAt: now }] }],
    };
    const normalized = normalizeTrackedDeck(withSubstitute);
    expect(normalized.slots[0].substitutes).toHaveLength(1);
    expect(normalized.slots[0].substitutes[0].owned).toBe(true);
  });
});

describe("mergeSubstituteCandidates", () => {
  it("同名の既存候補があれば所持チェックを引き継ぐ", () => {
    const now = "2026-09-15T00:00:00.000Z";
    const existing = [
      { candidateId: "sub-1", name: "駒D", reason: "旧理由", acquisitionNote: "旧入手方法", owned: true, updatedAt: "2026-09-01T00:00:00.000Z" },
    ];
    const incoming = [{ name: "駒D", reason: "新理由", acquisitionNote: "新入手方法" }];
    const merged = mergeSubstituteCandidates(existing, incoming, now);
    expect(merged).toHaveLength(1);
    expect(merged[0].candidateId).toBe("sub-1");
    expect(merged[0].owned).toBe(true);
    expect(merged[0].reason).toBe("新理由");
  });

  it("一致する既存候補が無ければ所持チェックはfalseで新規発行する", () => {
    const now = "2026-09-15T00:00:00.000Z";
    const merged = mergeSubstituteCandidates([], [{ name: "駒E", reason: null, acquisitionNote: null }], now);
    expect(merged).toHaveLength(1);
    expect(merged[0].owned).toBe(false);
    expect(merged[0].candidateId).toBeTruthy();
  });
});

describe("excludeDeckOwnPieces", () => {
  it("デッキ内の別の駒と同名の代用候補を除外する", () => {
    const candidates = [
      { name: "駒B", reason: null, acquisitionNote: null },
      { name: "駒D", reason: null, acquisitionNote: null },
    ];
    const { kept, excludedNames } = excludeDeckOwnPieces(candidates, ["駒A", "駒B", "駒C"]);
    expect(kept).toEqual([{ name: "駒D", reason: null, acquisitionNote: null }]);
    expect(excludedNames).toEqual(["駒B"]);
  });

  it("デッキ内の駒と一致しなければ全て残す", () => {
    const candidates = [{ name: "駒D", reason: null, acquisitionNote: null }];
    const { kept, excludedNames } = excludeDeckOwnPieces(candidates, ["駒A", "駒B", "駒C"]);
    expect(kept).toEqual(candidates);
    expect(excludedNames).toEqual([]);
  });

  it("前後の空白を無視して比較する", () => {
    const candidates = [{ name: " 駒B ", reason: null, acquisitionNote: null }];
    const { kept, excludedNames } = excludeDeckOwnPieces(candidates, ["駒B"]);
    expect(kept).toEqual([]);
    expect(excludedNames).toEqual(["駒B"]);
  });
});
