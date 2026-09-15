import type { DeckSlot } from "./types";

/**
 * デッキ内の各スロットが、代用込みで実質的に埋まっているとみなせるかを計算する。
 * 同じ代用候補（駒名）が複数のスロットにまたがって提案されている場合でも、
 * 実際に所持しているのは1体だけなので、1スロット分としてしかカウントしない
 * （デッキ内での駒名の並び順で、先に出てくるスロットを優先的に「対応可能」とする）。
 */
export function computeCoveredSlotIds(slots: DeckSlot[]): Set<string> {
  const covered = new Set<string>();
  const consumedSubstituteNames = new Set<string>();

  for (const slot of slots) {
    if (slot.owned) {
      covered.add(slot.slotId);
      continue;
    }
    const usable = slot.substitutes.find((c) => c.owned && !consumedSubstituteNames.has(c.name.trim()));
    if (usable) {
      covered.add(slot.slotId);
      consumedSubstituteNames.add(usable.name.trim());
    }
  }

  return covered;
}

/** そのスロットが実質的に埋まっているとみなせるか（coveredSlotIdsはcomputeCoveredSlotIdsの結果） */
export function isSlotCovered(slot: DeckSlot, coveredSlotIds: Set<string>): boolean {
  return coveredSlotIds.has(slot.slotId);
}

/** 代用込みで、実質的に埋まっているスロット数 */
export function countCoveredSlots(slots: DeckSlot[]): number {
  return computeCoveredSlotIds(slots).size;
}
