// Mock authentication. NOT security: credentials live in the browser. Replace with real API auth.
import { useSyncExternalStore } from "react";
import type { Session, User } from "@/types";
import { getDb } from "@/mocks/store";
import { delay, ServiceError } from "./config";

export interface AuthService {
  login(identifier: string, password: string, remember: boolean): Promise<Session>;
  logout(): Promise<void>;
  getSession(): Session | null;
}

const KEY = "scholar.session";
let session: Session | null = null;
let ready = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function initSession() {
  if (ready || typeof window === "undefined") return;
  ready = true;
  const raw = window.localStorage.getItem(KEY) ?? window.sessionStorage.getItem(KEY);
  session = raw ? (JSON.parse(raw) as Session) : null;
  emit();
}

export const DEMO_ACCOUNTS = [
  { label: "Subject Teacher", email: "teacher@scholar.edu.et" },
  { label: "Homeroom + Subject Teacher", email: "homeroom@scholar.edu.et" },
  { label: "Director", email: "director@scholar.edu.et" },
  { label: "Administrator", email: "admin@scholar.edu.et" },
] as const;
export const DEMO_PASSWORD = "Password123";

export const mockAuthService: AuthService = {
  async login(identifier, password, remember) {
    await delay(700);
    const db = getDb();
    const id = identifier.trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === id || u.email.split("@")[0].toLowerCase() === id);
    if (!user || db.passwords[user.id] !== password) throw new ServiceError("Incorrect email or password.");
    if (!user.active) throw new ServiceError("This account is deactivated. Contact the administrator.");
    session = { userId: user.id, remember, issuedAt: new Date().toISOString() };
    (remember ? window.localStorage : window.sessionStorage).setItem(KEY, JSON.stringify(session));
    emit();
    return session;
  },
  async logout() {
    session = null;
    window.localStorage.removeItem(KEY);
    window.sessionStorage.removeItem(KEY);
    emit();
  },
  getSession: () => session,
};

export const authService: AuthService = mockAuthService;

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** { ready: false } until browser storage has been read (avoids SSR flashes). */
export function useAuthState(): { ready: boolean; session: Session | null } {
  const s = useSyncExternalStore(subscribe, () => session, () => null);
  const r = useSyncExternalStore(subscribe, () => ready, () => false);
  return { ready: r, session: s };
}

export function useCurrentUser(): User | null {
  const { session: s } = useAuthState();
  const db = getDb();
  return s ? db.users.find((u) => u.id === s.userId) ?? null : null;
}
