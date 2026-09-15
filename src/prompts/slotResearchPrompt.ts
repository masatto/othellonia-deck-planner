import { MAX_SUBSTITUTES_PER_PIECE } from "./slotResearchSchema";

export interface SlotResearchTarget {
  pieceName: string;
}

const JSON_SCHEMA_EXAMPLE = `{
  "schemaVersion": 1,
  "checkedAt": "2026-09-15",
  "pieces": [
    {
      "pieceName": "駒名1",
      "acquisitionNote": "現在の入手方法（開催中のガチャ名等。不明ならnull）",
      "substitutes": [
        {
          "name": "代用候補の駒名",
          "reason": "代用できる理由（役割・属性が近い等）",
          "acquisitionNote": "その代用候補の入手方法（不明ならnull）"
        }
      ]
    }
  ]
}`;

/**
 * 未所持の駒について、入手方法と代用候補（各候補ごとの入手方法込み）を
 * まとめて調べるためのプロンプトを生成する。このアプリは所持駒データベースを
 * 持たないため、ユーザーの手持ち情報は渡さず、一般的に知られている代用候補・
 * 入手手段を尋ねる形にしている。代用候補を所持しているかどうかは、この調査の
 * 後にユーザー自身がアプリ内で個別にチェックする。
 *
 * deckPieceNamesには、このデッキを構成する全ての駒名（調査対象外の枠も含む）を
 * 渡す。1枠にしか入れられない都合上、デッキ内の別の駒を代用候補として提案しない
 * よう明示的に除外を指示するため（アプリ側でも取り込み時に同じ条件で保険的に
 * フィルタしている）。
 */
export function buildSlotResearchPrompt(deckName: string, targets: SlotResearchTarget[], deckPieceNames: string[]): string {
  const lines = targets.map((t) => `- ${t.pieceName}`).join("\n");
  const deckPieceLines = deckPieceNames.map((n) => `- ${n}`).join("\n");

  return `「逆転オセロニア」のデッキ「${deckName}」を組むにあたり、まだ所持していない
以下の駒について、現在確認できる公開情報をWeb検索して調べてください。

対象駒：
${lines}

各駒について次の情報を教えてください（不明な場合はnullにしてください。推測の場合は
本文中に「推測」と分かるように書いてください）:

1. acquisitionNote: 現時点でその駒をどうすれば入手できるか（開催中・過去のガチャ名や
   イベント名など）
2. substitutes: このデッキの中で役割が近く、代わりに使えそうな駒の候補を最大
   ${MAX_SUBSTITUTES_PER_PIECE}件まで。それぞれについて、代用できる理由(reason)と
   その駒自体の入手方法(acquisitionNote)も合わせて教えてください
   （代用候補が思いつかない場合は空配列で構いません）。
   **ただし、このデッキ自体を構成する以下の駒は、既に他の枠で採用されているため
   代用候補として提案しないでください**：
${deckPieceLines}

攻略記事の説明文を長く転載せず、事実情報を簡潔にまとめてください。

次のJSON形式だけを出力してください（このスキーマ・キー名に厳密に従ってください）：

\`\`\`json
${JSON_SCHEMA_EXAMPLE}
\`\`\`
`;
}
