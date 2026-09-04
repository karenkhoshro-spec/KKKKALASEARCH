import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { adminLogin as loginRequest, adminLogout, adminSessionInfo, ownerLogin as ownerLoginRequest } from "../utils/ordersApi";

const STORAGE_KEY = "kala-search-admin-token";

function readAdminToken(): string | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeAdminToken(value: string | null) {
  try {
    if (typeof sessionStorage === "undefined") return;
    if (value) sessionStorage.setItem(STORAGE_KEY, value);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore storage in SSR / tests */
  }
}

export type AdminRole = "admin" | "owner" | null;

interface AdminAuthValue {
  token: string | null;
  role: AdminRole;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  /** Owner (Hiboss) login — uses the separate OWNER_USERNAME/OWNER_PASSWORD. */
  ownerLogin: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readAdminToken());
  const [role, setRole] = useState<AdminRole>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const current = readAdminToken();
    if (!current) {
      setReady(true);
      return;
    }
    adminSessionInfo(current)
      .then((info) => {
        if (cancelled) return;
        if (info.ok) {
          setToken(current);
          setRole(info.role === "owner" ? "owner" : "admin");
        } else {
          writeAdminToken(null);
          setToken(null);
          setRole(null);
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const storeSession = useCallback(async (nextToken: string) => {
    writeAdminToken(nextToken);
    setToken(nextToken);
    try {
      const info = await adminSessionInfo(nextToken);
      setRole(info.ok ? (info.role === "owner" ? "owner" : "admin") : null);
    } catch {
      setRole(null);
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const next = await loginRequest(username, password);
      await storeSession(next);
    },
    [storeSession],
  );

  const ownerLogin = useCallback(
    async (username: string, password: string) => {
      const next = await ownerLoginRequest(username, password);
      await storeSession(next);
    },
    [storeSession],
  );

  /**
   * Logs out everywhere: the token is revoked server-side (fire-and-forget so
   * local logout always succeeds even offline) and removed from storage.
   */
  const logout = useCallback(() => {
    const current = readAdminToken();
    writeAdminToken(null);
    setToken(null);
    setRole(null);
    if (current) {
      void adminLogout(current).catch(() => {
        /* best-effort server revocation; local session is already cleared */
      });
    }
  }, []);

  const value = useMemo(
    () => ({ token, role, ready, login, ownerLogin, logout }),
    [token, role, ready, login, ownerLogin, logout],
  );
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
