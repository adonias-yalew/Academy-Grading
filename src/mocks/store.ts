// In-memory mock database with optional localStorage persistence (development only).
// Swap src/services/* implementations for API calls; UI should not import this file directly.
import { useSyncExternalStore } from "react";
import { createSeed, SEED_VERSION, type MockDatabase } from "./seed";

const STORAGE_KEY = "scholar.mockdb.v1";

let db: MockDatabase = createSeed();
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function loadPersisted() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDatabase;
      if (parsed.version === SEED_VERSION) {
        db = parsed;
        emit();
      }
    }
  } catch {
    /* ignore corrupt mock storage */
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* storage full — mock data stays in memory */
  }
}

export const getDb = () => db;

export function mutate(fn: (draft: MockDatabase) => void) {
  const draft = structuredClone(db);
  fn(draft);
  db = draft;
  persist();
  emit();
}

export function resetMockData() {
  db = createSeed();
  persist();
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useMockDb(): MockDatabase {
  return useSyncExternalStore(subscribe, getDb, getDb);
}
