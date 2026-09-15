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

  test("所持チェックを付けると未所持件数が減り、未所持駒の調査で入手方法・代用候補が反映される", async ({ page }) => {
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
        {
          pieceName: "ベータ",
          acquisitionNote: "現在開催中のガチャに実装",
          substitutes: [{ name: "デルタ", reason: "同じ役割のアタッカー", acquisitionNote: "常設ガチャに実装" }],
        },
        { pieceName: "ガンマ", acquisitionNote: "過去限定のため入手困難", substitutes: [] },
      ],
    };
    await page.getByPlaceholder("ChatGPTの回答をここに貼り付け").fill(JSON.stringify(researchResponse));
    await page.getByRole("button", { name: "検証して反映する" }).click();

    // 反映後はデッキ詳細へ戻らず、プロンプト一覧の画面に留まる
    // （複数バッチある場合に続けて次のバッチを貼り付けられるようにするため）
    await expect(page.getByRole("heading", { name: "未所持駒の調査プロンプト" })).toBeVisible();
    await expect(page.getByText(/2件のメモを反映しました/)).toBeVisible();
    await expect(page.getByText("✓ 反映済み")).toBeVisible();

    await page.getByRole("button", { name: "デッキ詳細へ戻る" }).click();
    await expect(page.getByRole("heading", { name: "テスト周回デッキ" })).toBeVisible();

    await expect(page.getByText("入手方法: 現在開催中のガチャに実装")).toBeVisible();
    await expect(page.getByText("入手方法: 過去限定のため入手困難")).toBeVisible();
    await expect(page.getByText("代用候補: 未調査")).toHaveCount(1); // ガンマはsubstitutesが空のまま

    // デルタ(代用候補)の一覧は初期状態では折りたたまれている
    await expect(page.getByText("代用候補（1件、所持 0件）")).toBeVisible();
    await expect(page.getByText("デルタ")).toHaveCount(0);
    const betaCard = page.locator(".card").filter({ hasText: "ベータ" }).first();
    await betaCard.getByRole("button", { name: /代用候補（1件/ }).click();
    await expect(page.getByText("デルタ")).toBeVisible();
    await expect(page.getByText("理由: 同じ役割のアタッカー")).toBeVisible();
    const substituteCheckbox = betaCard.locator(".card", { hasText: "デルタ" }).getByRole("checkbox");
    await substituteCheckbox.check();
    await expect(substituteCheckbox).toBeChecked();
    // 代用候補をチェックしても、本体の「ベータ」の所持チェックには影響しない
    const betaOwnedCheckbox = betaCard.getByRole("checkbox").first();
    await expect(betaOwnedCheckbox).not.toBeChecked();
  });

  test("代用候補の一覧は折りたたみ表示され、ボタンで開閉できる", async ({ page }) => {
    await trackTestDeck(page);
    await page.getByRole("button", { name: "🔍 未所持駒を調査する（3件）" }).click();
    await page.getByRole("button", { name: "ChatGPTの回答（JSON）を取り込む" }).click();

    const researchResponse = {
      schemaVersion: 1,
      checkedAt: "2026-09-15",
      pieces: [
        {
          pieceName: "ベータ",
          acquisitionNote: null,
          substitutes: [{ name: "デルタ", reason: null, acquisitionNote: null }],
        },
      ],
    };
    await page.getByPlaceholder("ChatGPTの回答をここに貼り付け").fill(JSON.stringify(researchResponse));
    await page.getByRole("button", { name: "検証して反映する" }).click();
    await page.getByRole("button", { name: "デッキ詳細へ戻る" }).click();

    // 反映直後も初期状態では折りたたまれている
    await expect(page.getByText("デルタ")).toHaveCount(0);
    const toggleButton = page.getByRole("button", { name: /代用候補（1件/ });
    await toggleButton.click();
    await expect(page.getByText("デルタ")).toBeVisible();
    await toggleButton.click();
    await expect(page.getByText("デルタ")).toHaveCount(0);
  });

  test("複数バッチに分かれる場合、1バッチ目を反映してもプロンプト画面に留まり続けて2バッチ目を取り込める", async ({
    page,
  }) => {
    const bigDeckResponse = {
      schemaVersion: 1,
      checkedAt: "2026-09-15",
      decks: [
        {
          deckName: "大規模デッキ",
          concept: null,
          pieces: ["駒1", "駒2", "駒3", "駒4", "駒5", "駒6"],
          sourceUrl: null,
          sourceTitle: null,
        },
      ],
    };
    await waitForAppReady(page);
    await page.getByRole("button", { name: "🔍 デッキを探す" }).click();
    await page.getByRole("button", { name: "プロンプトを生成する" }).click();
    await page.getByRole("button", { name: "ChatGPTの回答（JSON）を取り込む" }).click();
    await page.getByPlaceholder("ChatGPTの回答をここに貼り付け").fill(JSON.stringify(bigDeckResponse));
    await page.getByRole("button", { name: "検証する" }).click();
    await page.getByRole("button", { name: "このデッキを追跡する" }).click();

    await page.getByRole("button", { name: "🔍 未所持駒を調査する（6件）" }).click();
    // 5件ずつのバッチ2つに分かれる
    await expect(page.getByText("バッチ 1 / 2")).toBeVisible();
    await expect(page.getByText("バッチ 2 / 2")).toBeVisible();

    await page.getByRole("button", { name: "ChatGPTの回答（JSON）を取り込む" }).click();
    const batch1Response = {
      schemaVersion: 1,
      checkedAt: "2026-09-15",
      pieces: ["駒1", "駒2", "駒3", "駒4", "駒5"].map((name) => ({
        pieceName: name,
        acquisitionNote: "テスト入手方法",
        substitutes: [],
      })),
    };
    await page.getByPlaceholder("ChatGPTの回答をここに貼り付け").fill(JSON.stringify(batch1Response));
    await page.getByRole("button", { name: "検証して反映する" }).click();

    // プロンプト一覧の画面に留まったまま、バッチ1だけ反映済みになる
    await expect(page.getByRole("heading", { name: "未所持駒の調査プロンプト" })).toBeVisible();
    await expect(page.getByText("✓ 反映済み")).toHaveCount(1);

    // 再生成せずそのまま2バッチ目を取り込める
    await page.getByRole("button", { name: "ChatGPTの回答（JSON）を取り込む" }).click();
    const batch2Response = {
      schemaVersion: 1,
      checkedAt: "2026-09-15",
      pieces: [{ pieceName: "駒6", acquisitionNote: "テスト入手方法2", substitutes: [] }],
    };
    await page.getByPlaceholder("ChatGPTの回答をここに貼り付け").fill(JSON.stringify(batch2Response));
    await page.getByRole("button", { name: "検証して反映する" }).click();
    await expect(page.getByText("✓ 反映済み")).toHaveCount(2);

    await page.getByRole("button", { name: "デッキ詳細へ戻る" }).click();
    await expect(page.getByText("入手方法: テスト入手方法2")).toBeVisible();
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
