import { describe, expect, it } from "vitest";
import { createBackup, migrateBackup } from "../../src/backup/backupSchema";
import type { TrackedDeck } from "../../src/domain/types";

const sampleDeck: TrackedDeck = {
  deckId: "deck-1",
  deckName: "テストデッキ",
  concept: "コンセプト",
  sourceUrl: "https://example.com",
  sourceTitle: "サイト",
  checkedAt: "2026-09-14",
  slots: [
    {
      slotId: "slot-1",
      pieceName: "駒A",
      owned: true,
      substituteNote: null,
      acquisitionNote: null,
      updatedAt: "2026-09-14T00:00:00.000Z",
    },
  ],
  createdAt: "2026-09-14T00:00:00.000Z",
  updatedAt: "2026-09-14T00:00:00.000Z",
};

describe("backupSchema", () => {
  it("バックアップを作成し、そのまま往復復元できる", () => {
    const backup = createBackup([sampleDeck]);
    const json = JSON.parse(JSON.stringify(backup));
    const { trackedDecks, warnings } = migrateBackup(json);
    expect(trackedDecks).toHaveLength(1);
    expect(trackedDecks[0].deckId).toBe("deck-1");
    expect(trackedDecks[0].slots[0].owned).toBe(true);
    expect(warnings).toHaveLength(0);
  });

  it("不正な形式全体はエラーを投げる", () => {
    expect(() => migrateBackup(null)).toThrow();
    expect(() => migrateBackup("invalid")).toThrow();
  });

  it("trackedDecksが無い場合は空配列として扱う", () => {
    const { trackedDecks } = migrateBackup({ schemaVersion: 1 });
    expect(trackedDecks).toEqual([]);
  });

  it("不正なデッキデータ(HTMLタグ混入)は復元前に拒否し、警告付きでスキップする", () => {
    const corrupted = { ...sampleDeck, deckName: "<script>alert(1)</script>" };
    const backup = createBackup([corrupted]);
    const json = JSON.parse(JSON.stringify(backup));
    const { trackedDecks, warnings } = migrateBackup(json);
    expect(trackedDecks).toHaveLength(0);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("正常なデッキと不正なデッキが混在する場合、正常な方だけ復元する", () => {
    const corrupted = { ...sampleDeck, deckId: "deck-2", deckName: "<script>x</script>" };
    const backup = createBackup([sampleDeck, corrupted]);
    const json = JSON.parse(JSON.stringify(backup));
    const { trackedDecks, warnings } = migrateBackup(json);
    expect(trackedDecks).toHaveLength(1);
    expect(trackedDecks[0].deckId).toBe("deck-1");
    expect(warnings).toHaveLength(1);
  });
});
