export interface SlotResearchTarget {
  pieceName: string;
}

const JSON_SCHEMA_EXAMPLE = `{
  "schemaVersion": 1,
  "checkedAt": "2026-09-15",
  "pieces": [
    {
      "pieceName": "駒名1",
      "substituteSuggestion": "同じ役割で代用できそうな駒の説明（無ければnull）",
      "acquisitionNote": "現在の入手方法（開催中のガチャ名等。不明ならnull）"
    }
  ]
}`;

/**
 * 未所持の駒について、代替案・入手方法をまとめて調べるためのプロンプトを生成する。
 * このアプリは所持駒データベースを持たないため、ユーザーの手持ち情報は渡さず、
 * 一般的に知られている代替候補・入手手段を尋ねる形にしている。
 */
export function buildSlotResearchPrompt(deckName: string, targets: SlotResearchTarget[]): string {
  const lines = targets.map((t) => `- ${t.pieceName}`).join("\n");

  return `「逆転オセロニア」のデッキ「${deckName}」を組むにあたり、まだ所持していない
以下の駒について、現在確認できる公開情報をWeb検索して調べてください。

対象駒：
${lines}

各駒について次の2点を教えてください（不明な場合はnullにしてください。推測の場合は
本文中に「推測」と分かるように書いてください）:

1. substituteSuggestion: このデッキの中で役割が近く、代わりに使えそうな一般的な駒の候補
2. acquisitionNote: 現時点でその駒をどうすれば入手できるか（開催中・過去のガチャ名や
   イベント名など）

攻略記事の説明文を長く転載せず、事実情報を簡潔にまとめてください。

次のJSON形式だけを出力してください（このスキーマ・キー名に厳密に従ってください）：

\`\`\`json
${JSON_SCHEMA_EXAMPLE}
\`\`\`
`;
}
