import { z } from "zod";
import { NAME_MAX, SAFE_STRING_MAX, safeString, urlSchema } from "../prompts/safeSchema";
import type { TrackedDeck } from "../domain/types";

/**
 * バックアップ復元時に検証するスキーマ。
 * AIから直接受け取るデータではないが、不正なバックアップファイルによる
 * データ破壊・スクリプト混入を防ぐため、同様に厳格に検証する。
 */
const deckSlotSchema = z.object({
  slotId: safeString(100, 1),
  pieceName: safeString(NAME_MAX, 1),
  owned: z.boolean(),
  substituteNote: safeString(SAFE_STRING_MAX).nullable(),
  acquisitionNote: safeString(SAFE_STRING_MAX).nullable(),
  updatedAt: z.string(),
});

const trackedDeckSchema = z.object({
  deckId: safeString(100, 1),
  deckName: safeString(NAME_MAX, 1),
  concept: safeString(SAFE_STRING_MAX).nullable(),
  sourceUrl: urlSchema.nullable(),
  sourceTitle: safeString(NAME_MAX).nullable(),
  checkedAt: z.string().nullable(),
  slots: z.array(deckSlotSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export interface BackupFile {
  schemaVersion: 1;
  exportedAt: string;
  trackedDecks: TrackedDeck[];
}

export function createBackup(trackedDecks: TrackedDeck[]): BackupFile {
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), trackedDecks };
}

export interface MigrationResult {
  trackedDecks: TrackedDeck[];
  warnings: string[];
}

export function migrateBackup(raw: unknown): MigrationResult {
  if (typeof raw !== "object" || raw === null) throw new Error("不正な形式です");
  const obj = raw as Record<string, unknown>;
  const warnings: string[] = [];
  const decksRaw = Array.isArray(obj.trackedDecks) ? obj.trackedDecks : [];
  const trackedDecks: TrackedDeck[] = [];
  for (const d of decksRaw) {
    const parsed = trackedDeckSchema.safeParse(d);
    if (parsed.success) {
      trackedDecks.push(parsed.data as TrackedDeck);
    } else {
      warnings.push(`不正なデッキデータをスキップしました: ${parsed.error.issues[0]?.message ?? "不明なエラー"}`);
    }
  }
  return { trackedDecks, warnings };
}
