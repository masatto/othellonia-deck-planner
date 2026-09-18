import { test, expect, type Page } from "@playwright/test";
import { waitForAppReady } from "./testHelpers";

const DECK_SEARCH_RESPONSE = {
  schemaVersion: 1,
  checkedAt: "2026-09-15",
  decks: [
    {
      deckName: "バックアップ検証デッキ",
      concept: null,
      pieces: ["ピースA", "ピースB"],
      sourceUrl: null,
      sourceTitle: null,
    },
  ],
};

async function trackTestDeck(page: Page) {
  await waitForAppReady(page);
  await page.getByRole("button", { name: "🔍 デッキを探す" }).click();
  await page.getByRole("button", { name: "プロンプトを生成する" }).click();
  await page.getByRole("button", { name: "ChatGPTの回答（JSON）を取り込む" }).click();
  await page.getByPlaceholder("ChatGPTの回答をここに貼り付け").fill(JSON.stringify(DECK_SEARCH_RESPONSE));
  await page.getByRole("button", { name: "検証する" }).click();
  await page.getByRole("button", { name: "このデッキを追跡する" }).click();
  await page.getByRole("button", { name: "デッキ詳細を見る" }).click();
  await expect(page.getByRole("heading", { name: "バックアップ検証デッキ" })).toBeVisible();
}

test.describe("バックアップ・復元", () => {
  test("バックアップを保存し、削除後に復元するとデッキが元通りになる", async ({ page }) => {
    await trackTestDeck(page);
    await page.locator(".card", { hasText: "ピースA" }).getByRole("checkbox").check();

    await page.goto("/#/backup");
    await expect(page.getByRole("heading", { name: "データのバックアップ・復元" })).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "💾 バックアップを保存" }).click(),
    ]);
    await expect(page.getByText("バックアップを保存しました。")).toBeVisible();

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    if (stream) {
      for await (const chunk of stream) chunks.push(chunk as Buffer);
    }
    const backup = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
    expect(backup.trackedDecks).toHaveLength(1);
    expect(backup.trackedDecks[0].deckName).toBe("バックアップ検証デッキ");

    // 全データ削除
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "🗑 全データを削除する" }).click();
    await expect(page.getByText("すべてのデータを削除しました。")).toBeVisible();
    await page.goto("/");
    await expect(page.getByText("追跡中のデッキはまだありません。")).toBeVisible();

    // 復元
    await page.goto("/#/backup");
    await page.locator('input[type="file"]').setInputFiles({
      name: "restore.json",
      mimeType: "application/json",
      buffer: Buffer.concat(chunks),
    });
    await expect(page.getByText(/復元しました（デッキ1件）/)).toBeVisible();

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "デッキ一覧" })).toBeVisible();
    await expect(page.getByText("バックアップ検証デッキ")).toBeVisible();
    await expect(page.getByText("所持チェック: 1 / 2")).toBeVisible();
  });
});
