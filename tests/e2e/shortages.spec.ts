import { test, expect, type Page } from "@playwright/test";
import { waitForAppReady } from "./testHelpers";

async function trackDeck(page: Page, deckName: string, pieces: string[]) {
  const response = {
    schemaVersion: 1,
    checkedAt: "2026-09-15",
    decks: [{ deckName, concept: null, pieces, sourceUrl: null, sourceTitle: null }],
  };
  await page.goto("/#/search");
  await page.getByRole("button", { name: "プロンプトを生成する" }).click();
  await page.getByRole("button", { name: "ChatGPTの回答（JSON）を取り込む" }).click();
  await page.getByPlaceholder("ChatGPTの回答をここに貼り付け").fill(JSON.stringify(response));
  await page.getByRole("button", { name: "検証する" }).click();
  await page.getByRole("button", { name: "このデッキを追跡する" }).click();
  await expect(page.getByRole("heading", { name: deckName })).toBeVisible();
}

test.describe("代用で対応可能タグ・不足駒まとめ", () => {
  test("代用候補を所持チェックすると「代用で対応可能」タグが表示され、代用込みの件数が増える", async ({ page }) => {
    await waitForAppReady(page);
    await trackDeck(page, "デッキA", ["アルファ", "ベータ"]);

    await page.getByRole("button", { name: "🔍 未所持駒を調査する（2件）" }).click();
    await page.getByRole("button", { name: "ChatGPTの回答（JSON）を取り込む" }).click();
    const researchResponse = {
      schemaVersion: 1,
      checkedAt: "2026-09-15",
      pieces: [{ pieceName: "アルファ", acquisitionNote: null, substitutes: [{ name: "ガンマ", reason: null, acquisitionNote: null }] }],
    };
    await page.getByPlaceholder("ChatGPTの回答をここに貼り付け").fill(JSON.stringify(researchResponse));
    await page.getByRole("button", { name: "検証して反映する" }).click();
    await page.getByRole("button", { name: "デッキ詳細へ戻る" }).click();

    await expect(page.getByText("代用込み: 0 / 2")).toBeVisible();
    await expect(page.getByText("代用で対応可能")).toHaveCount(0);

    const alphaCard = page.locator(".card").filter({ hasText: "アルファ" }).first();
    const substituteCheckbox = alphaCard.locator(".card", { hasText: "ガンマ" }).getByRole("checkbox");
    await substituteCheckbox.check();

    await expect(page.getByText("代用で対応可能")).toBeVisible();
    await expect(page.getByText("代用込み: 1 / 2")).toBeVisible();
    // 所持チェック自体は変わらない(アルファ本体は未所持のまま)
    await expect(page.getByText("所持チェック: 0 / 2")).toBeVisible();
  });

  test("複数デッキで共通して必要な駒が不足駒まとめの上位に表示される", async ({ page }) => {
    await waitForAppReady(page);
    await trackDeck(page, "デッキA", ["共通駒", "固有駒A"]);
    await page.goto("/#/");
    await trackDeck(page, "デッキB", ["共通駒", "固有駒B"]);

    await page.goto("/#/");
    await page.getByRole("button", { name: "📊 不足駒まとめを見る" }).click();
    await expect(page.getByRole("heading", { name: "不足駒まとめ" })).toBeVisible();

    const rows = page.locator(".card").filter({ has: page.getByText("デッキで必要") });
    await expect(rows.first()).toContainText("共通駒");
    await expect(rows.first()).toContainText("2デッキで必要");
    await expect(rows.first().getByRole("link", { name: "デッキA" })).toBeVisible();
    await expect(rows.first().getByRole("link", { name: "デッキB" })).toBeVisible();

    // 固有駒は1デッキのみで必要
    await expect(page.getByText("1デッキで必要")).toHaveCount(2);

    // リンクから該当デッキへ遷移できる
    await rows.first().getByRole("link", { name: "デッキA" }).click();
    await expect(page.getByRole("heading", { name: "デッキA" })).toBeVisible();
  });

  test("所持チェック・代用候補チェックで解消されると不足駒まとめから消える", async ({ page }) => {
    await waitForAppReady(page);
    await trackDeck(page, "デッキA", ["アルファ"]);

    await page.goto("/#/shortages");
    await expect(page.getByText("アルファ")).toBeVisible();

    await page.goto("/#/");
    await page.locator(".card", { hasText: "デッキA" }).click();
    await page.locator(".card").filter({ hasText: "アルファ" }).getByRole("checkbox").check();

    await page.goto("/#/shortages");
    await expect(page.getByText("🎉 追跡中の全デッキで、不足している駒はありません。")).toBeVisible();
  });
});
