import { DECK_SEARCH_MAX_PIECES_PER_DECK } from "./deckSearchSchema";

const JSON_SCHEMA_EXAMPLE = `{
  "schemaVersion": 1,
  "checkedAt": "2026-09-15",
  "decks": [
    {
      "deckName": "編成案の名前",
      "concept": "簡単なコンセプト説明",
      "pieces": ["駒名1", "駒名2", "駒名3"],
      "sourceUrl": "https://example.com/source",
      "sourceTitle": "参照したサイト名"
    }
  ]
}`;

/**
 * デッキ編成案を検索するためのプロンプトを生成する。
 * 画像・所持駒情報は一切含めない（このアプリは所持駒データベースを持たない）。
 */
export function buildDeckSearchPrompt(theme: string): string {
  const trimmed = theme.trim();
  const themeLine = trimmed
    ? `テーマ・条件: ${trimmed}`
    : "テーマ・条件: 特に指定なし（現在有力とされている編成を複数提案してください）";

  return `「逆転オセロニア」のデッキ編成案について、現在確認できる公開情報をWeb検索してください。

${themeLine}

複数の編成案が見つかった場合は、可能な範囲でいくつか候補を挙げてください
（1件しか見つからない場合は1件で構いません。最大${DECK_SEARCH_MAX_PIECES_PER_DECK}体程度までの駒名一覧を想定しています）。
それぞれの編成案について、デッキ名・簡単なコンセプト説明・使用する駒名の一覧・
参照した出典URLとサイト名を含めてください。
確認できない項目はnullにしてください。
攻略記事の説明文を長く転載せず、事実情報を簡潔に構造化してください。

次のJSON形式だけを出力してください（このスキーマ・キー名に厳密に従ってください）：

\`\`\`json
${JSON_SCHEMA_EXAMPLE}
\`\`\`
`;
}
