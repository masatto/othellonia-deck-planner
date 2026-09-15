import { useNavigate } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";
import { countCoveredSlots } from "../domain/coverage";

export function HomePage() {
  const navigate = useNavigate();
  const { trackedDecks } = useAppData();

  const sorted = [...trackedDecks].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return (
    <div className="screen">
      <h1>デッキ一覧</h1>
      <p className="muted">
        選択したファイル・貼り付けたテキストはこの端末内で処理され、外部には送信されません。ChatGPT等への送信は、あなたがコピー＆ペーストした場合のみ行われます。
      </p>

      {sorted.length === 0 ? (
        <div className="card">
          <p className="muted">追跡中のデッキはまだありません。</p>
          <button className="btn btn-primary btn-block" onClick={() => navigate("/search")}>
            🔍 デッキを探す
          </button>
        </div>
      ) : (
        <>
          <button className="btn btn-primary btn-block" style={{ marginBottom: 8 }} onClick={() => navigate("/search")}>
            🔍 新しいデッキを探す
          </button>
          <button className="btn btn-block" style={{ marginBottom: 12 }} onClick={() => navigate("/shortages")}>
            📊 不足駒まとめを見る
          </button>
          {sorted.map((deck) => {
            const ownedCount = deck.slots.filter((s) => s.owned).length;
            const coveredCount = countCoveredSlots(deck.slots);
            return (
              <div key={deck.deckId} className="card" onClick={() => navigate(`/deck/${deck.deckId}`)} style={{ cursor: "pointer" }}>
                <div style={{ fontWeight: 600 }}>{deck.deckName}</div>
                {deck.concept && <p className="muted" style={{ marginTop: 4 }}>{deck.concept}</p>}
                <div className="muted" style={{ marginTop: 4 }}>
                  所持チェック: {ownedCount} / {deck.slots.length}
                  {coveredCount !== ownedCount && ` （代用込み: ${coveredCount} / ${deck.slots.length}）`}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
