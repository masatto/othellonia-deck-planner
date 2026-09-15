import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearAllData, deleteTrackedDeck, getAllTrackedDecks, getTrackedDeck, putTrackedDeck, resetDbForTests } from "../../src/db/database";
import type { TrackedDeck } from "../../src/domain/types";

function makeDeck(deckId: string): TrackedDeck {
  const now = new Date().toISOString();
  return {
    deckId,
    deckName: `デッキ${deckId}`,
    concept: null,
    sourceUrl: null,
    sourceTitle: null,
    checkedAt: null,
    slots: [{ slotId: "slot-1", pieceName: "駒A", owned: false, substituteNote: null, acquisitionNote: null, updatedAt: now }],
    createdAt: now,
    updatedAt: now,
  };
}

describe("IndexedDBデータ層", () => {
  beforeEach(() => {
    resetDbForTests();
  });

  afterEach(async () => {
    await clearAllData();
    resetDbForTests();
  });

  it("デッキを保存・取得・削除できる", async () => {
    await putTrackedDeck(makeDeck("d1"));
    let all = await getAllTrackedDecks();
    expect(all).toHaveLength(1);
    expect(await getTrackedDeck("d1")).toMatchObject({ deckId: "d1" });

    await deleteTrackedDeck("d1");
    all = await getAllTrackedDecks();
    expect(all).toHaveLength(0);
  });

  it("同じdeckIdで保存すると上書きされる", async () => {
    await putTrackedDeck(makeDeck("d1"));
    const updated = { ...makeDeck("d1"), deckName: "更新後の名前" };
    await putTrackedDeck(updated);
    const all = await getAllTrackedDecks();
    expect(all).toHaveLength(1);
    expect(all[0].deckName).toBe("更新後の名前");
  });

  it("clearAllDataで全デッキが空になる", async () => {
    await putTrackedDeck(makeDeck("d1"));
    await putTrackedDeck(makeDeck("d2"));
    await clearAllData();
    expect(await getAllTrackedDecks()).toHaveLength(0);
  });

  it("存在しないdeckIdはundefinedを返す", async () => {
    expect(await getTrackedDeck("not-exist")).toBeUndefined();
  });
});
