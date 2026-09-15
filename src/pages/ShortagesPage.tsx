import { Link, useNavigate } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";
import { summarizeShortages } from "../domain/shortageSummary";

export function ShortagesPage() {
  const navigate = useNavigate();
  const { trackedDecks } = useAppData();
  const shortages = summarizeShortages(trackedDecks);

  return (
    <div className="screen">
      <h1>不足駒まとめ</h1>
      <p className="muted">
        追跡中の全デッキを横断し、まだ所持しておらず代用でも対応できていない駒を集計しています。
        複数のデッキで必要とされている駒ほど上に表示されます（既存のデータから計算しているだけで、
        新たにAIへ調査を依頼するものではありません）。
      </p>

      {trackedDecks.length === 0 ? (
        <div className="card">
          <p className="muted">追跡中のデッキがありません。</p>
        </div>
      ) : shortages.length === 0 ? (
        <div className="card">
          <p className="muted">🎉 追跡中の全デッキで、不足している駒はありません。</p>
        </div>
      ) : (
        shortages.map((s) => (
          <div key={s.pieceName} className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 600 }}>{s.pieceName}</div>
              <span className="tag tag-warning">{s.neededByDecks.length}デッキで必要</span>
            </div>
            <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {s.neededByDecks.map((d) => (
                <Link key={d.deckId} to={`/deck/${d.deckId}`} className="tag" style={{ textDecoration: "none" }}>
                  {d.deckName}
                </Link>
              ))}
            </div>
          </div>
        ))
      )}

      <button className="btn btn-block" onClick={() => navigate("/")}>
        デッキ一覧へ戻る
      </button>
    </div>
  );
}
