import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";
import { buildDeckSearchPrompt } from "../prompts/deckSearchPrompt";
import { validateDeckSearchResponse, type DeckCandidate } from "../prompts/deckSearchSchema";
import { parseExtractedJson } from "../prompts/jsonExtraction";
import { buildTrackedDeckFromCandidate } from "../domain/deckBuilder";
import { copyToClipboard, downloadTextFile } from "../backup/shareUtils";

type Step = "input" | "prompt" | "import" | "candidates";

export function DeckSearchPage() {
  const navigate = useNavigate();
  const { upsertTrackedDeck } = useAppData();

  const [step, setStep] = useState<Step>("input");
  const [theme, setTheme] = useState("");
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [importErrors, setImportErrors] = useState<string[] | null>(null);
  const [checkedAt, setCheckedAt] = useState<string>("");
  const [candidates, setCandidates] = useState<DeckCandidate[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function generatePrompt() {
    setPrompt(buildDeckSearchPrompt(theme));
    setStep("prompt");
  }

  async function copyPrompt() {
    await copyToClipboard(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function runValidation(text: string) {
    setImportErrors(null);
    const parsed = parseExtractedJson(text);
    if (!parsed.ok) {
      setImportErrors([parsed.error ?? "JSONの解析に失敗しました"]);
      return;
    }
    const validated = validateDeckSearchResponse(parsed.data);
    if (!validated.ok) {
      setImportErrors(validated.errors);
      return;
    }
    setCandidates(validated.data.decks);
    setCheckedAt(validated.data.checkedAt);
    setStep("candidates");
  }

  async function handleFileSelect(file: File) {
    const text = await file.text();
    runValidation(text);
  }

  async function trackDeck(candidate: DeckCandidate) {
    const now = new Date().toISOString();
    const deck = buildTrackedDeckFromCandidate(candidate, checkedAt, now);
    await upsertTrackedDeck(deck);
    navigate(`/deck/${deck.deckId}`);
  }

  if (step === "prompt") {
    return (
      <div className="screen">
        <h1>デッキ探索プロンプト</h1>
        <div className="card">
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontSize: 12,
              maxHeight: 320,
              overflowY: "auto",
              background: "var(--bg)",
              padding: 8,
              borderRadius: 8,
            }}
          >
            {prompt}
          </pre>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <button className="btn" onClick={copyPrompt}>
              {copied ? "コピーしました" : "📋 コピー"}
            </button>
            <button className="btn" onClick={() => downloadTextFile("deck-search-prompt.txt", prompt, "text/plain")}>
              💾 テキスト保存
            </button>
          </div>
        </div>
        <button className="btn btn-block" style={{ marginBottom: 8 }} onClick={() => setStep("input")}>
          テーマを変更する
        </button>
        <button className="btn btn-primary btn-block" onClick={() => setStep("import")}>
          ChatGPTの回答（JSON）を取り込む
        </button>
      </div>
    );
  }

  if (step === "import") {
    return (
      <div className="screen">
        <h1>デッキ候補のJSON取込</h1>
        <p className="muted">ChatGPTの回答をそのまま貼り付けてください。```json コードブロックがあれば自動で抽出します。</p>
        <div className="card">
          <textarea
            rows={10}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="ChatGPTの回答をここに貼り付け"
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => runValidation(importText)}>
              検証する
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
        <button className="btn btn-block" onClick={() => setStep("prompt")}>
          プロンプトへ戻る
        </button>
      </div>
    );
  }

  if (step === "candidates") {
    return (
      <div className="screen">
        <h1>デッキ候補</h1>
        <p className="muted">気に入った編成案を選んで「このデッキを追跡する」を押してください。</p>
        {candidates.map((c, i) => (
          <div key={i} className="card">
            <div style={{ fontWeight: 600 }}>{c.deckName}</div>
            {c.concept && <p className="muted" style={{ marginTop: 4 }}>{c.concept}</p>}
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
              {c.pieces.map((p, j) => (
                <span key={j} className="tag">
                  {p}
                </span>
              ))}
            </div>
            {c.sourceUrl && (
              <p className="muted" style={{ marginTop: 8 }}>
                出典:{" "}
                <a href={c.sourceUrl} target="_blank" rel="noreferrer">
                  {c.sourceTitle ?? c.sourceUrl}
                </a>
              </p>
            )}
            <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} onClick={() => trackDeck(c)}>
              このデッキを追跡する
            </button>
          </div>
        ))}
        <button className="btn btn-block" onClick={() => setStep("input")}>
          最初からやり直す
        </button>
      </div>
    );
  }

  return (
    <div className="screen">
      <h1>デッキを探す</h1>
      <p className="muted">
        テーマや条件（任意）を入力してプロンプトを生成し、ChatGPT等に貼り付けて調査してください。何も入力しなければ、現在有力とされる編成を広く提案するよう依頼します。
      </p>
      <div className="card">
        <textarea
          rows={3}
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="例: 初心者向けの周回デッキ／竜属性の高火力デッキ など（空欄でも可）"
        />
      </div>
      <button className="btn btn-primary btn-block" onClick={generatePrompt}>
        プロンプトを生成する
      </button>
    </div>
  );
}
