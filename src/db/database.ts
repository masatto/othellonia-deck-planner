import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { TrackedDeck } from "../domain/types";

interface DeckPlannerDB extends DBSchema {
  trackedDecks: {
    key: string;
    value: TrackedDeck;
  };
}

const DB_NAME = "othellonia-deck-planner";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DeckPlannerDB>> | null = null;

function getDb(): Promise<IDBPDatabase<DeckPlannerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DeckPlannerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("trackedDecks")) {
          db.createObjectStore("trackedDecks", { keyPath: "deckId" });
        }
      },
    });
  }
  return dbPromise;
}

/** テスト用にDB接続をリセットする（fake-indexeddbを差し替えた際に必要） */
export function resetDbForTests(): void {
  dbPromise = null;
}

export async function getAllTrackedDecks(): Promise<TrackedDeck[]> {
  return (await getDb()).getAll("trackedDecks");
}

export async function getTrackedDeck(deckId: string): Promise<TrackedDeck | undefined> {
  return (await getDb()).get("trackedDecks", deckId);
}

export async function putTrackedDeck(deck: TrackedDeck): Promise<void> {
  await (await getDb()).put("trackedDecks", deck);
}

export async function deleteTrackedDeck(deckId: string): Promise<void> {
  await (await getDb()).delete("trackedDecks", deckId);
}

export async function clearAllData(): Promise<void> {
  await (await getDb()).clear("trackedDecks");
}
