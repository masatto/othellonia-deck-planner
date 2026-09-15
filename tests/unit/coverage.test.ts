import { describe, expect, it } from "vitest";
import { computeCoveredSlotIds, countCoveredSlots, isSlotCovered } from "../../src/domain/coverage";
import type { DeckSlot, SubstituteCandidate } from "../../src/domain/types";

function makeSlot(slotId: string, overrides: Partial<DeckSlot> = {}): DeckSlot {
  return {
    slotId,
    pieceName: `駒-${slotId}`,
    owned: false,
    acquisitionNote: null,
    substitutes: [],
    updatedAt: "2026-09-15T00:00:00.000Z",
    ...overrides,
  };
}

function makeSubstitute(name: string, owned: boolean): SubstituteCandidate {
  return { candidateId: `sub-${name}`, name, reason: null, acquisitionNote: null, owned, updatedAt: "2026-09-15T00:00:00.000Z" };
}

describe("computeCoveredSlotIds / isSlotCovered", () => {
  it("本体を所持していればカバー済み", () => {
    const slots = [makeSlot("1", { owned: true })];
    const covered = computeCoveredSlotIds(slots);
    expect(isSlotCovered(slots[0], covered)).toBe(true);
  });

  it("本体は未所持だが、所持している代用候補が1件でもあればカバー済み", () => {
    const slots = [makeSlot("1", { substitutes: [makeSubstitute("駒B", false), makeSubstitute("駒C", true)] })];
    const covered = computeCoveredSlotIds(slots);
    expect(isSlotCovered(slots[0], covered)).toBe(true);
  });

  it("本体未所持・代用候補も未所持ならカバーされていない", () => {
    const slots = [makeSlot("1", { substitutes: [makeSubstitute("駒B", false)] })];
    const covered = computeCoveredSlotIds(slots);
    expect(isSlotCovered(slots[0], covered)).toBe(false);
  });

  it("代用候補が無い場合はカバーされていない", () => {
    const slots = [makeSlot("1")];
    const covered = computeCoveredSlotIds(slots);
    expect(isSlotCovered(slots[0], covered)).toBe(false);
  });

  it("同じ代用候補が複数スロットにまたがる場合、実際に使えるのは1体分のみなので先のスロットだけがカバーされる", () => {
    const slots = [
      makeSlot("1", { substitutes: [makeSubstitute("共通駒", true)] }),
      makeSlot("2", { substitutes: [makeSubstitute("共通駒", true)] }),
    ];
    const covered = computeCoveredSlotIds(slots);
    expect(isSlotCovered(slots[0], covered)).toBe(true);
    expect(isSlotCovered(slots[1], covered)).toBe(false);
  });

  it("本体を所持しているスロットは共有プールを消費しないため、他のスロットが同じ代用候補を使える", () => {
    const slots = [
      makeSlot("1", { owned: true, substitutes: [makeSubstitute("共通駒", true)] }),
      makeSlot("2", { substitutes: [makeSubstitute("共通駒", true)] }),
    ];
    const covered = computeCoveredSlotIds(slots);
    expect(isSlotCovered(slots[0], covered)).toBe(true);
    expect(isSlotCovered(slots[1], covered)).toBe(true);
  });

  it("異なる代用候補名であれば、それぞれ独立してカバーできる", () => {
    const slots = [
      makeSlot("1", { substitutes: [makeSubstitute("駒X", true)] }),
      makeSlot("2", { substitutes: [makeSubstitute("駒Y", true)] }),
    ];
    const covered = computeCoveredSlotIds(slots);
    expect(isSlotCovered(slots[0], covered)).toBe(true);
    expect(isSlotCovered(slots[1], covered)).toBe(true);
  });
});

describe("countCoveredSlots", () => {
  it("所持・代用いずれかでカバーされているスロット数を数える（共有分は重複カウントしない）", () => {
    const slots = [
      makeSlot("1", { owned: true }),
      makeSlot("2", { substitutes: [makeSubstitute("共通駒", true)] }),
      makeSlot("3", { substitutes: [makeSubstitute("共通駒", true)] }),
    ];
    expect(countCoveredSlots(slots)).toBe(2);
  });
});
