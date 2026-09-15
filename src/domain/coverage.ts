import type { DeckSlot } from "./types";

/**
 * そのスロットが実質的に埋まっているとみなせるか。
 * 元の駒を所持している場合はもちろん、所持している代用候補が1件でもあれば
 * 「代用で対応可能」として扱う。
 */
export function isSlotCovered(slot: DeckSlot): boolean {
  return slot.owned || slot.substitutes.some((c) => c.owned);
}

/** 代用候補での対応を含めた、実質的に埋まっているスロット数 */
export function countCoveredSlots(slots: DeckSlot[]): number {
  return slots.filter(isSlotCovered).length;
}
