import { test, expect } from "@playwright/test";
import { waitForAppReady } from "./testHelpers";

const DECK_SEARCH_RESPONSE = {
  schemaVersion: 1,
  checkedAt: "2026-09-15",
  decks: [
    {
      deckName: "テスト周回デッキ",
      concept: "テスト用のコンセプト",
      pieces: ["アルファ", "ベータ", "ガンマ"],
      sourceUrl: "https://example.com/deck",
      sourceTitle: "テストサイト",
    },
  ],
};

async function trackTestDeck(page: import("@playwright/test").Page) {
  await waitForAppReady(page);
  await page.getByRole("button", { name: "🔍 デッキを探す" }).click();
  await page.getByRole("button", { name: "プロンプトを生成する" }).click();
  await page.getByRole("button", { name: "ChatGPTの回答（JSON）を取り込む" }).click();
  await page.getByPlaceholder("ChatGPTの回答をここに貼り付け").fill(JSON.stringify(DECK_SEARCH_RESPONSE));
  await page.getByRole("button", { name: "検証する" }).click();
  await expect(page.getByRole("heading", { name: "デッキ候補" })).toBeVisible();
  await page.getByRole("button", { name: "このデッキを追跡する" }).click();
  await expect(page.getByRole("heading", { name: "テスト周回デッキ" })).toBeVisible();
}

test.describe("デッキ探索→追跡→所持チェック→未所持駒調査", () => {
  test("デッキ候補を検索し、選んだデッキを追跡できる", async ({ page }) => {
    await trackTestDeck(page);
    await expect(page.getByText("アルファ")).toBeVisible();
    await expect(page.getByText("ベータ")).toBeVisible();
    await expect(page.getByText("ガンマ")).toBeVisible();
    await expect(page.getByText("所持チェック: 0 / 3")).toBeVisible();
  });

  test("所持チェックを付けると未所持件数が減り、未所持駒の調査で代替案・入手方法が反映される", async ({ page }) => {
    await trackTestDeck(page);

    // アルファは所持しているのでチェックを付ける
    await page.locator(".card", { hasText: "アルファ" }).getByRole("checkbox").check();
    await expect(page.getByText("所持チェック: 1 / 3")).toBeVisible();
    await expect(page.getByRole("button", { name: "🔍 未所持駒を調査する（2件）" })).toBeVisible();

    await page.getByRole("button", { name: "🔍 未所持駒を調査する（2件）" }).click();
    await expect(page.getByRole("heading", { name: "未所持駒の調査プロンプト" })).toBeVisible();
    await page.getByRole("button", { name: "ChatGPTの回答（JSON）を取り込む" }).click();

    const researchResponse = {
      schemaVersion: 1,
      checkedAt: "2026-09-15",
      pieces: [
        { pieceName: "ベータ", substituteSuggestion: "デルタで代用可能", acquisitionNote: "現在開催中のガチャに実装" },
        { pieceName: "ガンマ", substituteSuggestion: null, acquisitionNote: "過去限定のため入手困難" },
      ],
    };
    await page.getByPlaceholder("ChatGPTの回答をここに貼り付け").fill(JSON.stringify(researchResponse));
    await page.getByRole("button", { name: "検証して反映する" }).click();

    await expect(page.getByText(/2件のメモを反映しました/)).toBeVisible();
    await expect(page.getByText("代替案: デルタで代用可能")).toBeVisible();
    await expect(page.getByText("入手方法: 現在開催中のガチャに実装")).toBeVisible();
    await expect(page.getByText("代替案: 未調査")).toHaveCount(1); // ガンマはsubstituteSuggestionがnullのまま
    await expect(page.getByText("入手方法: 過去限定のため入手困難")).toBeVisible();
  });

  test("不正なデッキ探索JSON(pieces空)は検証エラーが表示される", async ({ page }) => {
    await waitForAppReady(page);
    await page.getByRole("button", { name: "🔍 デッキを探す" }).click();
    await page.getByRole("button", { name: "プロンプトを生成する" }).click();
    await page.getByRole("button", { name: "ChatGPTの回答（JSON）を取り込む" }).click();
    const invalid = { schemaVersion: 1, checkedAt: "2026-09-15", decks: [{ deckName: "空デッキ", pieces: [] }] };
    await page.getByPlaceholder("ChatGPTの回答をここに貼り付け").fill(JSON.stringify(invalid));
    await page.getByRole("button", { name: "検証する" }).click();
    await expect(page.getByText(/検証エラー/)).toBeVisible();
  });

  test("デッキの追跡をやめると一覧から消える", async ({ page }) => {
    await trackTestDeck(page);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "🗑 このデッキの追跡をやめる" }).click();
    await expect(page.getByRole("heading", { name: "デッキ一覧" })).toBeVisible();
    await expect(page.getByText("追跡中のデッキはまだありません。")).toBeVisible();
  });
});
