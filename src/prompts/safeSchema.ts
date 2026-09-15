import { z } from "zod";

/**
 * AIが返すJSONの厳格な検証に使う共通ヘルパー。
 * HTML/スクリプトの混入や異常に長い文字列、危険なURLスキームを拒否する。
 */

export const SAFE_STRING_MAX = 300;
export const NAME_MAX = 200;

export const noHtml = (value: string) => !/<[^>]*>/.test(value);

export const safeString = (max: number, min = 0) =>
  z
    .string()
    .min(min, min > 0 ? "文字列が空です" : undefined)
    .max(max, `文字列が長すぎます（上限${max}文字）`)
    .refine(noHtml, "HTMLタグを含む文字列は許可されません");

/**
 * ChatGPTの回答がプレーンなURLではなく "[url](url)" 形式のMarkdownリンクとして
 * 返ってくることがある。その場合はリンク先(括弧内)を実際のURLとして扱う。
 */
function extractMarkdownLinkUrl(value: string): string {
  const match = value.match(/^\[([^[\]]*)\]\(([^()]+)\)$/);
  if (match && /^https?:\/\//i.test(match[2])) {
    return match[2];
  }
  return value;
}

export const urlSchema = z.preprocess(
  (v) => (typeof v === "string" ? extractMarkdownLinkUrl(v) : v),
  z
    .string()
    .max(2000)
    .refine((u) => /^https?:\/\//i.test(u), "URLはhttp/httpsのみ許可されます")
    .refine(noHtml, "HTMLタグを含む文字列は許可されません"),
);

export const dateStringSchema = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), "checkedAtは有効な日付ではありません");
