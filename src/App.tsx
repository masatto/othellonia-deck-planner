import type { ReactNode } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppDataProvider, useAppData } from "./state/AppDataContext";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { DeckSearchPage } from "./pages/DeckSearchPage";
import { DeckDetailPage } from "./pages/DeckDetailPage";
import { ShortagesPage } from "./pages/ShortagesPage";
import { BackupPage } from "./pages/BackupPage";
import { UpdateNotifier } from "./components/UpdateNotifier";

/** IndexedDBからの初期読み込みが終わるまで画面を出さない（データ0件でも起動できる） */
function AppReadyGate({ children }: { children: ReactNode }) {
  const { loading } = useAppData();
  if (loading) {
    return (
      <div className="screen">
        <p className="muted">読み込み中…</p>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AppDataProvider>
      <HashRouter>
        <UpdateNotifier />
        <AppReadyGate>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<DeckSearchPage />} />
              <Route path="/deck/:deckId" element={<DeckDetailPage />} />
              <Route path="/shortages" element={<ShortagesPage />} />
              <Route path="/backup" element={<BackupPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AppReadyGate>
      </HashRouter>
    </AppDataProvider>
  );
}
