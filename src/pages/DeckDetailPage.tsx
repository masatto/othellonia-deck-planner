import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";
import { buildSlotResearchPrompt } from "../prompts/slotResearchPrompt";
import { SLOT_RESEARCH_MAX_PIECES, validateSlotResearchResponse } from "../prompts/slotResearchSchema";
import { splitIntoBatches } from "../prompts/batching";
import { parseExtractedJson } from "../prompts/jsonExtraction";
import { copyToClipboard, downloadTextFile } from "../backup/shareUtils";
import { mergeSubstituteCandidates } from "../domain/deckBuilder";

type Step = "detail" | "researchPrompt" | "researchImport";

export function DeckDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { trackedDecks, upsertTrackedDeck, deleteTrackedDeck } = useAppData();
  const deck = trackedDecks.find((d) => d.deckId === deckId);

  const [step, setStep] = useState<Step>("detail");
  const [promptBatches, setPromptBatches] = useState<string[]>([]);
  const [copiedBatch, setCopiedBatch] = useState<number | null>(null);
  const [importText, setImportText] = useState("");
  const [importErrors, setImportErrors] = useState<string[] | null>(null);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unownedSlots = useMemo(() => deck?.slots.filter((s) => !s.owned) ?? [], [deck]);

  if (!deck) {
    return (
      <div className="screen">
        <h1>デッキが見つかりません</h1>
        <button className="btn btn-block" onClick={() => navigate("/")}>
          デッキ一覧へ戻る
        </button>
      </div>
    );
  }

  async function toggleOwned(slotId: string) {
    if (!deck) return;
    const now = new Date().toISOString();
    const slots = deck.slots.map((s) => (s.slotId === slotId ? { ...s, owned: !s.owned, updatedAt: now } : s));
    await upsertTrackedDeck({ ...deck, slots, updatedAt: now });
  }

  async function toggleSubstituteOwned(slotId: string, candidateId: string) {
    if (!deck) return;
    const now = new Date().toISOString();
    const slots = deck.slots.map((s) => {
      if (s.slotId !== slotId) return s;
      const substitutes = s.substitutes.map((c) => (c.candidateId === candidateId ? { ...c, owned: !c.owned, updatedAt: now } : c));
      return { ...s, substitutes };
    });
    await upsertTrackedDeck({ ...deck, slots, updatedAt: now });
  }

  function generateResearchPrompt() {
    const batches = splitIntoBatches(unownedSlots, SLOT_RESEARCH_MAX_PIECES).map((batch) =>
      buildSlotResearchPrompt(deck!.deckName, batch.map((s) => ({ pieceName: s.pieceName }))),
    );
    setPromptBatches(batches);
    setStep("researchPrompt");
  }

  async function copyBatch(i: number) {
    await copyToClipboard(promptBatches[i]);
    setCopiedBatch(i);
    setTimeout(() => setCopiedBatch(null), 2000);
  }

  function runResearchValidation(text: string) {
    if (!deck) return;
    setImportErrors(null);
    const parsed = parseExtractedJson(text);
    if (!parsed.ok) {
      setImportErrors([parsed.error ?? "JSONの解析に失敗しました"]);
      return;
    }
    const validated = validateSlotResearchResponse(parsed.data);
    if (!validated.ok) {
      setImportErrors(validated.errors);
      return;
    }

    const now = new Date().toISOString();
    let appliedCount = 0;
    const unmatched: string[] = [];
    const byName = new Map(validated.data.pieces.map((p) => [p.pieceName.trim(), p]));

    const slots = deck.slots.map((s) => {
      const match = byName.get(s.pieceName.trim());
      if (!match) return s;
      appliedCount++;
      return {
        ...s,
        acquisitionNote: match.acquisitionNote,
        substitutes: mergeSubstituteCandidates(s.substitutes, match.substitutes, now),
        updatedAt: now,
      };
    });

    const matchedNames = new Set(deck.slots.map((s) => s.pieceName.trim()));
    for (const name of byName.keys()) {
      if (!matchedNames.has(name)) unmatched.push(name);
    }

    upsertTrackedDeck({ ...deck, slots, updatedAt: now });
    setApplyMessage(
      `${appliedCount}件のメモを反映しました。` +
        (unmatched.length > 0 ? ` 一致しなかった駒名: ${unmatched.join(", ")}` : ""),
    );
    setImportText("");
    setStep("detail");
  }

  async function handleFileSelect(file: File) {
    const text = await file.text();
    runResearchValidation(text);
  }

  async function handleDeleteDeck() {
    if (!deck) return;
    if (!confirm(`「${deck.deckName}」の追跡をやめて削除しますか？`)) return;
    await deleteTrackedDeck(deck.deckId);
    navigate("/");
  }

  if (step === "researchPrompt") {
    return (
      <div className="screen">
        <h1>未所持駒の調査プロンプト</h1>
        <p className="muted">代替候補と入手方法をまとめて調べます。ChatGPT等に貼り付けて実行してください。</p>
        {promptBatches.map((batch, i) => (
          <div className="card" key={i}>
            <h2>
              バッチ {i + 1} / {promptBatches.length}
            </h2>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 12,
                maxHeight: 280,
                overflowY: "auto",
                background: "var(--bg)",
                padding: 8,
                borderRadius: 8,
              }}
            >
              {batch}
            </pre>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" onClick={() => copyBatch(i)}>
                {copiedBatch === i ? "コピーしました" : "📋 コピー"}
              </button>
              <button className="btn" onClick={() => downloadTextFile(`slot-research-${i + 1}.txt`, batch, "text/plain")}>
                💾 テキスト保存
              </button>
            </div>
          </div>
        ))}
        <button className="btn btn-block" style={{ marginBottom: 8 }} onClick={() => setStep("detail")}>
          デッキ詳細へ戻る
        </button>
        <button className="btn btn-primary btn-block" onClick={() => setStep("researchImport")}>
          ChatGPTの回答（JSON）を取り込む
        </button>
      </div>
    );
  }

  if (step === "researchImport") {
    return (
      <div className="screen">
        <h1>調査結果のJSON取込</h1>
        <p className="muted">ChatGPTの回答をそのまま貼り付けてください。```json コードブロックがあれば自動で抽出します。</p>
        <div className="card">
          <textarea
            rows={10}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="ChatGPTの回答をここに貼り付け"
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => runResearchValidation(importText)}>
              検証して反映する
            </button>
            <button className="btn" onClick={() => fileInputRef.current?.click()}>
              📂 JSONファイルを選択
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json,.txt"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = "";
            }}
          />
        </div>
        {importErrors && (
          <div className="card" style={{ borderColor: "var(--danger)" }}>
            <h2>検証エラー</h2>
            <ul>
              {importErrors.map((e, i) => (
                <li key={i} className="muted">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button className="btn btn-block" onClick={() => setStep("researchPrompt")}>
          プロンプトへ戻る
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <h1>{deck.deckName}</h1>
      {deck.concept && <p className="muted">{deck.concept}</p>}
      {deck.sourceUrl && (
        <p className="muted">
          出典:{" "}
          <a href={deck.sourceUrl} target="_blank" rel="noreferrer">
            {deck.sourceTitle ?? deck.sourceUrl}
          </a>
          {deck.checkedAt ? `（確認日: ${deck.checkedAt}）` : ""}
        </p>
      )}

      {applyMessage && (
        <div className="card" role="status">
          {applyMessage}
        </div>
      )}

      <div className="card">
        <div className="muted">
          所持チェック: {deck.slots.length - unownedSlots.length} / {deck.slots.length}
        </div>
      </div>

      {deck.slots.map((slot) => (
        <div key={slot.slotId} className="card">
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <input type="checkbox" checked={slot.owned} onChange={() => toggleOwned(slot.slotId)} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{slot.pieceName}</div>
              {!slot.owned && (
                <>
                  {slot.acquisitionNote ? (
                    <p className="muted" style={{ marginTop: 4 }}>
                      入手方法: {slot.acquisitionNote}
                    </p>
                  ) : (
                    <p className="muted" style={{ marginTop: 4 }}>
                      入手方法: 未調査
                    </p>
                  )}

                  {slot.substitutes.length === 0 ? (
                    <p className="muted">代用候補: 未調査</p>
                  ) : (
                    <div style={{ marginTop: 6 }}>
                      <p className="muted">代用候補:</p>
                      {slot.substitutes.map((c) => (
                        <div
                          key={c.candidateId}
                          className="card"
                          style={{ marginTop: 4, marginBottom: 0, padding: 10 }}
                        >
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                          {c.reason && <p className="muted">理由: {c.reason}</p>}
                          <p className="muted">入手方法: {c.acquisitionNote ?? "未調査"}</p>
                          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <input
                              type="checkbox"
                              checked={c.owned}
                              onChange={() => toggleSubstituteOwned(slot.slotId, c.candidateId)}
                            />
                            <span className="muted">この代用候補を所持している</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </label>
        </div>
      ))}

      <button
        className="btn btn-primary btn-block"
        style={{ marginBottom: 8 }}
        disabled={unownedSlots.length === 0}
        onClick={generateResearchPrompt}
      >
        🔍 未所持駒を調査する（{unownedSlots.length}件）
      </button>
      <button className="btn btn-danger btn-block" onClick={handleDeleteDeck}>
        🗑 このデッキの追跡をやめる
      </button>
    </div>
  );
}
