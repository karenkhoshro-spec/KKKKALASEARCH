import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { adminLogin as loginRequest, adminLogout, adminSession } from "../utils/ordersApi";

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

interface AdminAuthValue {
  token: string | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readAdminToken());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const current = readAdminToken();
    if (!current) {
      setReady(true);
      return;
    }
    adminSession(current)
      .then((ok) => {
        if (cancelled) return;
        if (ok) setToken(current);
        else {
          writeAdminToken(null);
          setToken(null);
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const next = await loginRequest(username, password);
    writeAdminToken(next);
    setToken(next);
  }, []);

  /**
   * Logs out everywhere: the token is revoked server-side (fire-and-forget so
   * local logout always succeeds even offline) and removed from storage.
   */
  const logout = useCallback(() => {
    const current = readAdminToken();
    writeAdminToken(null);
    setToken(null);
    if (current) {
      void adminLogout(current).catch(() => {
        /* best-effort server revocation; local session is already cleared */
      });
    }
  }, []);

  const value = useMemo(() => ({ token, ready, login, logout }), [token, ready, login, logout]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
