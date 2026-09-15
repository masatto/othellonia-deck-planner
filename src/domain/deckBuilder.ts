import type { DeckCandidate } from "../prompts/deckSearchSchema";
import type { DeckSlot, SubstituteCandidate, TrackedDeck } from "./types";

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

/** デッキ候補を、追跡対象のTrackedDeckへ変換する（各駒名を1枠として発行する） */
export function buildTrackedDeckFromCandidate(candidate: DeckCandidate, checkedAt: string, now: string): TrackedDeck {
  const slots: DeckSlot[] = candidate.pieces.map((pieceName) => ({
    slotId: generateId("slot"),
    pieceName,
    owned: false,
    acquisitionNote: null,
    substitutes: [],
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

/**
 * IndexedDBから読み込んだデータを最新の形へ補正する。
 * 旧バージョン（substitutes配列を持たず、代わりに自由記述のsubstituteNoteを
 * 持っていた形式）で保存された既存デッキを読んでも壊れないようにするための
 * 後方互換処理。旧形式のsubstituteNoteは構造化できないため、次回「未所持駒を
 * 調査する」を実行するまでは代用候補なし（空配列）として扱う
 * （所持チェック・入手方法メモ等、他のデータは失われない）。
 */
export function normalizeTrackedDeck(deck: TrackedDeck): TrackedDeck {
  return {
    ...deck,
    slots: deck.slots.map((slot) => ({
      ...slot,
      substitutes: Array.isArray(slot.substitutes) ? slot.substitutes : [],
    })),
  };
}

/**
 * 未所持駒の調査結果から新しい代用候補一覧を組み立てる。
 * 既存の代用候補と名前が一致するものがあれば、ユーザーが付けた所持チェックを
 * 引き継ぐ（再調査のたびにチェックが消えてしまうのを防ぐため）。
 */
export function mergeSubstituteCandidates(
  existing: SubstituteCandidate[],
  incoming: { name: string; reason: string | null; acquisitionNote: string | null }[],
  now: string,
): SubstituteCandidate[] {
  const existingByName = new Map(existing.map((c) => [c.name.trim(), c]));
  return incoming.map((c) => {
    const prior = existingByName.get(c.name.trim());
    return {
      candidateId: prior?.candidateId ?? generateId("sub"),
      name: c.name,
      reason: c.reason,
      acquisitionNote: c.acquisitionNote,
      owned: prior?.owned ?? false,
      updatedAt: now,
    };
  });
}
