export const APP_DATA_SCHEMA_VERSION = 1;

/**
 * 追跡中のデッキ編成案の1枠（駒1体分）。
 * 駒の同一性は名前だけで扱う（このアプリは所持駒データベースを持たない）。
 */
export interface DeckSlot {
  slotId: string;
  /** ネット上の編成案から取り込んだ駒名（表記ゆれの可能性あり） */
  pieceName: string;
  /** ユーザーが「所持している」とチェックしたか */
  owned: boolean;
  /** 代替駒の提案メモ（AI調査結果、自由記述。未調査ならnull） */
  substituteNote: string | null;
  /** 入手方法メモ（AI調査結果、自由記述。未調査ならnull） */
  acquisitionNote: string | null;
  updatedAt: string;
}

/** 追跡対象として保存したデッキ編成案（IndexedDB: trackedDecks） */
export interface TrackedDeck {
  deckId: string;
  deckName: string;
  concept: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  /** AIが調査した時点（デッキ探索時の回答由来、環境の変化があり得るため参考情報） */
  checkedAt: string | null;
  slots: DeckSlot[];
  createdAt: string;
  updatedAt: string;
}
