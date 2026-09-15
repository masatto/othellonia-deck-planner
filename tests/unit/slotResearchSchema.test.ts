import { describe, expect, it } from "vitest";
import {
  MAX_SUBSTITUTES_PER_PIECE,
  SLOT_RESEARCH_MAX_PIECES,
  validateSlotResearchResponse,
} from "../../src/prompts/slotResearchSchema";

function basePayload(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    checkedAt: "2026-09-15",
    pieces: [
      {
        pieceName: "駒A",
        acquisitionNote: "現在開催中のガチャに実装",
        substitutes: [{ name: "駒B", reason: "同じ役割のアタッカー", acquisitionNote: "常設ガチャに実装" }],
      },
    ],
    ...overrides,
  };
}

describe("validateSlotResearchResponse", () => {
  it("正常な調査結果を検証できる", () => {
    const result = validateSlotResearchResponse(basePayload());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.pieces[0].pieceName).toBe("駒A");
      expect(result.data.pieces[0].substitutes).toHaveLength(1);
      expect(result.data.pieces[0].substitutes[0].name).toBe("駒B");
    }
  });

  it("acquisitionNoteがnullでも許容する", () => {
    const payload = basePayload({ pieces: [{ pieceName: "駒A", acquisitionNote: null, substitutes: [] }] });
    const result = validateSlotResearchResponse(payload);
    expect(result.ok).toBe(true);
  });

  it("substitutesが無い場合は空配列として扱う", () => {
    const payload = basePayload({ pieces: [{ pieceName: "駒A", acquisitionNote: null }] });
    const result = validateSlotResearchResponse(payload);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.pieces[0].substitutes).toEqual([]);
  });

  it("piecesが空なら拒否する", () => {
    const result = validateSlotResearchResponse(basePayload({ pieces: [] }));
    expect(result.ok).toBe(false);
  });

  it(`piecesが上限(${SLOT_RESEARCH_MAX_PIECES}件)を超えると拒否する`, () => {
    const pieces = Array.from({ length: SLOT_RESEARCH_MAX_PIECES + 1 }, (_, i) => ({
      pieceName: `駒${i}`,
      acquisitionNote: null,
      substitutes: [],
    }));
    const result = validateSlotResearchResponse(basePayload({ pieces }));
    expect(result.ok).toBe(false);
  });

  it(`substitutesが上限(${MAX_SUBSTITUTES_PER_PIECE}件)を超えると拒否する`, () => {
    const substitutes = Array.from({ length: MAX_SUBSTITUTES_PER_PIECE + 1 }, (_, i) => ({
      name: `代用${i}`,
      reason: null,
      acquisitionNote: null,
    }));
    const payload = basePayload({ pieces: [{ pieceName: "駒A", acquisitionNote: null, substitutes }] });
    const result = validateSlotResearchResponse(payload);
    expect(result.ok).toBe(false);
  });

  it("HTMLタグを含む文字列は拒否する", () => {
    const payload = basePayload({
      pieces: [{ pieceName: "駒A", acquisitionNote: "<img src=x onerror=alert(1)>", substitutes: [] }],
    });
    const result = validateSlotResearchResponse(payload);
    expect(result.ok).toBe(false);
  });

  it("代用候補のnameが空文字なら拒否する", () => {
    const payload = basePayload({
      pieces: [{ pieceName: "駒A", acquisitionNote: null, substitutes: [{ name: "", reason: null, acquisitionNote: null }] }],
    });
    const result = validateSlotResearchResponse(payload);
    expect(result.ok).toBe(false);
  });

  it("pieceNameが空文字なら拒否する", () => {
    const payload = basePayload({ pieces: [{ pieceName: "", acquisitionNote: null, substitutes: [] }] });
    const result = validateSlotResearchResponse(payload);
    expect(result.ok).toBe(false);
  });
});
