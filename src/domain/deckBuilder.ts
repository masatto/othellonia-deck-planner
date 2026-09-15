import type { DeckCandidate } from "../prompts/deckSearchSchema";
import type { DeckSlot, TrackedDeck } from "./types";

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

/** デッキ候補を、追跡対象のTrackedDeckへ変換する（各駒名を1枠として発行する） */
export function buildTrackedDeckFromCandidate(candidate: DeckCandidate, checkedAt: string, now: string): TrackedDeck {
  const slots: DeckSlot[] = candidate.pieces.map((pieceName) => ({
    slotId: generateId("slot"),
    pieceName,
    owned: false,
    substituteNote: null,
    acquisitionNote: null,
    updatedAt: now,
  }));

  return {
    deckId: generateId("deck"),
    deckName: candidate.deckName,
    concept: candidate.concept,
    sourceUrl: candidate.sourceUrl,
    sourceTitle: candidate.sourceTitle,
    checkedAt,
    slots,
    createdAt: now,
    updatedAt: now,
  };
}
