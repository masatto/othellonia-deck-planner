import { expect, type Page } from "@playwright/test";

/** IndexedDBからの初期読み込みが終わり、実際の画面が描画されるまで待つ */
export async function waitForAppReady(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "デッキ一覧" })).toBeVisible();
}
