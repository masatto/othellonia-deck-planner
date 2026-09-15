import { describe, expect, it } from "vitest";
import { validateDeckSearchResponse } from "../../src/prompts/deckSearchSchema";

function basePayload(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    checkedAt: "2026-09-15",
    decks: [
      {
        deckName: "テストデッキ",
        concept: "テスト用のコンセプト",
        pieces: ["駒A", "駒B", "駒C"],
        sourceUrl: "https://example.com/source",
        sourceTitle: "テストサイト",
      },
    ],
    ...overrides,
  };
}

describe("validateDeckSearchResponse", () => {
  it("正常なデッキ探索結果を検証できる", () => {
    const result = validateDeckSearchResponse(basePayload());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.decks).toHaveLength(1);
      expect(result.data.decks[0].pieces).toEqual(["駒A", "駒B", "駒C"]);
    }
  });

  it("schemaVersionが不正なら拒否する", () => {
    const result = validateDeckSearchResponse(basePayload({ schemaVersion: 2 }));
    expect(result.ok).toBe(false);
  });

  it("decksが空配列なら拒否する", () => {
    const result = validateDeckSearchResponse(basePayload({ decks: [] }));
    expect(result.ok).toBe(false);
  });

  it("piecesが空配列なら拒否する", () => {
    const payload = basePayload();
    (payload.decks[0] as Record<string, unknown>).pieces = [];
    const result = validateDeckSearchResponse(payload);
    expect(result.ok).toBe(false);
  });

  it("HTMLタグを含む文字列は拒否する", () => {
    const payload = basePayload();
    (payload.decks[0] as Record<string, unknown>).deckName = "<script>alert(1)</script>";
    const result = validateDeckSearchResponse(payload);
    expect(result.ok).toBe(false);
  });

  it("sourceUrlがhttp/https以外の場合は拒否する", () => {
    const payload = basePayload();
    (payload.decks[0] as Record<string, unknown>).sourceUrl = "javascript:alert(1)";
    const result = validateDeckSearchResponse(payload);
    expect(result.ok).toBe(false);
  });

  it("Markdownリンク形式のURLは実URLとして検証する", () => {
    const payload = basePayload();
    (payload.decks[0] as Record<string, unknown>).sourceUrl = "[出典](https://example.com/foo)";
    const result = validateDeckSearchResponse(payload);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.decks[0].sourceUrl).toBe("https://example.com/foo");
  });

  it("conceptやsourceUrlがnullでも許容する", () => {
    const payload = basePayload();
    (payload.decks[0] as Record<string, unknown>).concept = null;
    (payload.decks[0] as Record<string, unknown>).sourceUrl = null;
    const result = validateDeckSearchResponse(payload);
    expect(result.ok).toBe(true);
  });

  it("複数のデッキ候補を検証できる", () => {
    const payload = basePayload({
      decks: [
        { deckName: "デッキ1", concept: null, pieces: ["A"], sourceUrl: null, sourceTitle: null },
        { deckName: "デッキ2", concept: null, pieces: ["B", "C"], sourceUrl: null, sourceTitle: null },
      ],
    });
    const result = validateDeckSearchResponse(payload);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.decks).toHaveLength(2);
  });
});
