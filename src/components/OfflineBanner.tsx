import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div
      style={{
        background: "var(--warning)",
        color: "#1a1a2e",
        textAlign: "center",
        fontSize: 12,
        padding: "4px 8px",
      }}
    >
      オフラインです。デッキの閲覧・チェック・メモの編集は端末内で引き続き利用できます（AI調査には接続が必要です）。
    </div>
  );
}
