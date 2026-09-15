import { useRef, useState } from "react";
import { useAppData } from "../state/AppDataContext";
import { createBackup, migrateBackup } from "../backup/backupSchema";
import { downloadTextFile } from "../backup/shareUtils";

export function BackupPage() {
  const { trackedDecks, upsertTrackedDeck, resetAllData } = useAppData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  function exportBackup() {
    const backup = createBackup(trackedDecks);
    downloadTextFile(
      `othellonia-deck-planner-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(backup, null, 2),
      "application/json",
    );
    setMessage("バックアップを保存しました。");
  }

  async function handleImportFile(file: File) {
    try {
      const text = await file.text();
      const raw = JSON.parse(text);
      const { trackedDecks: restored, warnings } = migrateBackup(raw);
      for (const deck of restored) {
        await upsertTrackedDeck(deck);
      }
      setMessage(
        `復元しました（デッキ${restored.length}件）。${warnings.length > 0 ? "警告: " + warnings.join(" / ") : ""}`,
      );
    } catch (e) {
      setMessage(`復元に失敗しました: ${e instanceof Error ? e.message : String(e)}（既存のデータは変更されていません）`);
    }
  }

  async function handleDeleteAll() {
    if (!confirm(`端末内のすべてのデッキデータ（${trackedDecks.length}件）を削除します。よろしいですか？\n事前にバックアップを保存することを推奨します。`)) {
      return;
    }
    await resetAllData();
    setMessage("すべてのデータを削除しました。");
  }

  return (
    <div className="screen">
      <h1>データのバックアップ・復元</h1>
      <p className="muted">選択したファイルの内容はこの端末内で処理され、外部には送信されません。</p>

      {message && (
        <div className="card" role="status">
          {message}
        </div>
      )}

      <div className="card">
        <h2>バックアップ</h2>
        <p className="muted">Safariのサイトデータ削除・機種変更・PWAの再インストールに備えて、定期的に保存してください。</p>
        <button className="btn btn-primary btn-block" onClick={exportBackup}>
          💾 バックアップを保存
        </button>
        <p className="muted" style={{ marginTop: 8 }}>
          対象件数: デッキ {trackedDecks.length} 件
        </p>
      </div>

      <div className="card">
        <h2>復元</h2>
        <p className="muted">JSONバックアップファイルから復元します。既存のデッキと同じdeckIdがあれば上書きされます。</p>
        <button className="btn btn-block" onClick={() => fileInputRef.current?.click()}>
          📂 バックアップファイルを選択
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="card" style={{ borderColor: "var(--danger)" }}>
        <h2>全データ削除</h2>
        <p className="muted">端末内のすべてのデッキデータを削除します。元に戻せません。</p>
        <button className="btn btn-danger btn-block" onClick={handleDeleteAll}>
          🗑 全データを削除する
        </button>
      </div>
    </div>
  );
}
