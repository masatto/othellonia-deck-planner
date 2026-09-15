import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  clearAllData,
  deleteTrackedDeck as dbDeleteTrackedDeck,
  getAllTrackedDecks,
  putTrackedDeck,
} from "../db/database";
import type { TrackedDeck } from "../domain/types";

interface AppDataContextValue {
  loading: boolean;
  trackedDecks: TrackedDeck[];
  upsertTrackedDeck: (deck: TrackedDeck) => Promise<void>;
  deleteTrackedDeck: (deckId: string) => Promise<void>;
  resetAllData: () => Promise<void>;
  refreshTrackedDecks: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [trackedDecks, setTrackedDecks] = useState<TrackedDeck[]>([]);

  const refreshTrackedDecks = useCallback(async () => {
    setTrackedDecks(await getAllTrackedDecks());
  }, []);

  useEffect(() => {
    (async () => {
      await refreshTrackedDecks();
      setLoading(false);
    })();
  }, [refreshTrackedDecks]);

  const upsertTrackedDeck = useCallback(async (deck: TrackedDeck) => {
    // チェックボックス等の操作を即座に画面へ反映するため、先に状態を更新してから
    // 永続化する（controlled inputがDB書き込み完了まで一瞬古い値に戻るのを防ぐ）
    setTrackedDecks((prev) => {
      const next = prev.filter((d) => d.deckId !== deck.deckId);
      next.push(deck);
      return next;
    });
    await putTrackedDeck(deck);
  }, []);

  const deleteTrackedDeck = useCallback(async (deckId: string) => {
    await dbDeleteTrackedDeck(deckId);
    setTrackedDecks((prev) => prev.filter((d) => d.deckId !== deckId));
  }, []);

  const resetAllData = useCallback(async () => {
    await clearAllData();
    setTrackedDecks([]);
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({ loading, trackedDecks, upsertTrackedDeck, deleteTrackedDeck, resetAllData, refreshTrackedDecks }),
    [loading, trackedDecks, upsertTrackedDeck, deleteTrackedDeck, resetAllData, refreshTrackedDecks],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
