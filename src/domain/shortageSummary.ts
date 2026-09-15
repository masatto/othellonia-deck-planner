import { isSlotCovered } from "./coverage";
import type { TrackedDeck } from "./types";

export interface ShortageDeckRef {
  deckId: string;
  deckName: string;
}

export interface ShortagePieceSummary {
  pieceName: string;
  neededByDecks: ShortageDeckRef[];
}

/**
 * 追跡中の全デッキを横断し、未所持かつ代用でも対応できていない駒を集計する。
 * 複数のデッキで必要とされている駒ほど優先度が高いとみなし、件数の多い順に並べる。
 * 所持チェック・代用候補の所持チェックなど、既存のデータだけで計算できる
 * （AIへの再調査は不要）。
 */
export function summarizeShortages(decks: TrackedDeck[]): ShortagePieceSummary[] {
  const byName = new Map<string, ShortagePieceSummary>();

  for (const deck of decks) {
    for (const slot of deck.slots) {
      if (isSlotCovered(slot)) continue;
      const key = slot.pieceName.trim();
      const existing = byName.get(key);
      if (existing) {
        if (!existing.neededByDecks.some((d) => d.deckId === deck.deckId)) {
          existing.neededByDecks.push({ deckId: deck.deckId, deckName: deck.deckName });
        }
      } else {
        byName.set(key, { pieceName: slot.pieceName, neededByDecks: [{ deckId: deck.deckId, deckName: deck.deckName }] });
      }
    }
  }

  return [...byName.values()].sort((a, b) => b.neededByDecks.length - a.neededByDecks.length);
}
