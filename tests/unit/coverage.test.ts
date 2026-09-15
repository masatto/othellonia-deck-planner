import { describe, expect, it } from "vitest";
import { countCoveredSlots, isSlotCovered } from "../../src/domain/coverage";
import type { DeckSlot } from "../../src/domain/types";

function makeSlot(overrides: Partial<DeckSlot> = {}): DeckSlot {
  return {
    slotId: "slot-1",
    pieceName: "駒A",
    owned: false,
    acquisitionNote: null,
    substitutes: [],
    updatedAt: "2026-09-15T00:00:00.000Z",
    ...overrides,
  };
}

describe("isSlotCovered", () => {
  it("本体を所持していればカバー済み", () => {
    expect(isSlotCovered(makeSlot({ owned: true }))).toBe(true);
  });

  it("本体は未所持だが、所持している代用候補が1件でもあればカバー済み", () => {
    const slot = makeSlot({
      owned: false,
      substitutes: [
        { candidateId: "s1", name: "駒B", reason: null, acquisitionNote: null, owned: false, updatedAt: "2026-09-15T00:00:00.000Z" },
        { candidateId: "s2", name: "駒C", reason: null, acquisitionNote: null, owned: true, updatedAt: "2026-09-15T00:00:00.000Z" },
      ],
    });
    expect(isSlotCovered(slot)).toBe(true);
  });

  it("本体未所持・代用候補も未所持ならカバーされていない", () => {
    const slot = makeSlot({
      owned: false,
      substitutes: [{ candidateId: "s1", name: "駒B", reason: null, acquisitionNote: null, owned: false, updatedAt: "2026-09-15T00:00:00.000Z" }],
    });
    expect(isSlotCovered(slot)).toBe(false);
  });

  it("代用候補が無い場合はカバーされていない", () => {
    expect(isSlotCovered(makeSlot())).toBe(false);
  });
});

describe("countCoveredSlots", () => {
  it("所持・代用いずれかでカバーされているスロット数を数える", () => {
    const slots = [
      makeSlot({ slotId: "1", owned: true }),
      makeSlot({
        slotId: "2",
        owned: false,
        substitutes: [{ candidateId: "s1", name: "駒B", reason: null, acquisitionNote: null, owned: true, updatedAt: "2026-09-15T00:00:00.000Z" }],
      }),
      makeSlot({ slotId: "3", owned: false }),
    ];
    expect(countCoveredSlots(slots)).toBe(2);
  });
});
