import { describe, expect, it } from "vitest";
import { validateSlotResearchResponse, SLOT_RESEARCH_MAX_PIECES } from "../../src/prompts/slotResearchSchema";

function basePayload(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    checkedAt: "2026-09-15",
    pieces: [{ pieceName: "駒A", substituteSuggestion: "駒Bで代用可能", acquisitionNote: "現在開催中のガチャに実装" }],
    ...overrides,
  };
}

describe("validateSlotResearchResponse", () => {
  it("正常な調査結果を検証できる", () => {
    const result = validateSlotResearchResponse(basePayload());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pieces[0].pieceName).toBe("駒A");
      expect(result.data.pieces[0].substituteSuggestion).toBe("駒Bで代用可能");
    }
  });

  it("substituteSuggestion/acquisitionNoteがnullでも許容する", () => {
    const payload = basePayload({ pieces: [{ pieceName: "駒A", substituteSuggestion: null, acquisitionNote: null }] });
    const result = validateSlotResearchResponse(payload);
    expect(result.ok).toBe(true);
  });

  it("piecesが空なら拒否する", () => {
    const result = validateSlotResearchResponse(basePayload({ pieces: [] }));
    expect(result.ok).toBe(false);
  });

  it(`piecesが上限(${SLOT_RESEARCH_MAX_PIECES}件)を超えると拒否する`, () => {
    const pieces = Array.from({ length: SLOT_RESEARCH_MAX_PIECES + 1 }, (_, i) => ({
      pieceName: `駒${i}`,
      substituteSuggestion: null,
      acquisitionNote: null,
    }));
    const result = validateSlotResearchResponse(basePayload({ pieces }));
    expect(result.ok).toBe(false);
  });

  it("HTMLタグを含む文字列は拒否する", () => {
    const payload = basePayload({
      pieces: [{ pieceName: "駒A", substituteSuggestion: "<img src=x onerror=alert(1)>", acquisitionNote: null }],
    });
    const result = validateSlotResearchResponse(payload);
    expect(result.ok).toBe(false);
  });

  it("pieceNameが空文字なら拒否する", () => {
    const payload = basePayload({ pieces: [{ pieceName: "", substituteSuggestion: null, acquisitionNote: null }] });
    const result = validateSlotResearchResponse(payload);
    expect(result.ok).toBe(false);
  });
});
