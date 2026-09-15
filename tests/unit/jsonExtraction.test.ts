import { describe, expect, it } from "vitest";
import { parseExtractedJson } from "../../src/prompts/jsonExtraction";

describe("parseExtractedJson", () => {
  it("素のJSONを解析できる", () => {
    const result = parseExtractedJson('{"a": 1}');
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ a: 1 });
  });

  it("```json コードブロックから抽出して解析できる", () => {
    const result = parseExtractedJson('前置き\n```json\n{"a": 1}\n```\n後書き');
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ a: 1 });
  });

  it("BOM付きのテキストでも解析できる", () => {
    const bom = String.fromCharCode(0xfeff);
    const result = parseExtractedJson(bom + '{"a": 1}');
    expect(result.ok).toBe(true);
  });

  it("スマート引用符を正規化して解析できる", () => {
    const smart = "{“a”: 1}";
    const result = parseExtractedJson(smart);
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ a: 1 });
  });

  it("JSON部分が見つからない場合はエラーを返す", () => {
    const result = parseExtractedJson("これはJSONではありません");
    expect(result.ok).toBe(false);
  });

  it("サイズ上限を超える場合はエラーを返す", () => {
    const big = '{"a": "' + "x".repeat(1000) + '"}';
    const result = parseExtractedJson(big, 100);
    expect(result.ok).toBe(false);
  });
});
