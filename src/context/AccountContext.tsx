import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Account } from "../types";

export interface OrderRecord {
  orderNumber: string;
  date: string;
  total: number;
  itemsCount: number;
}

interface AccountContextValue {
  account: Account | null;
  isLoggedIn: boolean;
  pendingPhone: string | null;
  /** Demo-only OTP kept in memory so the UI can be tested without a real SMS gateway. */
  demoOtp: string | null;
  requestOtp: (phone: string) => string;
  verifyOtp: (code: string) => boolean;
  updateName: (name: string) => void;
  logout: () => void;
  orders: OrderRecord[];
  addOrder: (order: OrderRecord) => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);
const STORAGE_KEY = "kala-search-account";
const ORDERS_KEY = "kala-search-orders";

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Account) : null;
    } catch {
      return null;
    }
  });
  const [pendingPhone, setPendingPhone] = useState<string | null>(null);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      return raw ? (JSON.parse(raw) as OrderRecord[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (account) localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    else localStorage.removeItem(STORAGE_KEY);
  }, [account]);

  useEffect(() => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  // NOTE: This is a frontend-only demo OTP flow. There is no real SMS backend
  // connected in this project, so the code is generated locally and shown to
  // the user for testing purposes only. It is never presented as a real SMS.
  const requestOtp = useCallback((phone: string) => {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setPendingPhone(phone);
    setDemoOtp(code);
    return code;
  }, []);

  const verifyOtp = useCallback(
    (code: string) => {
      if (!pendingPhone || !demoOtp) return false;
      if (code.trim() === demoOtp) {
        setAccount({ phone: pendingPhone });
        setPendingPhone(null);
        setDemoOtp(null);
        return true;
      }
      return false;
    },
    [pendingPhone, demoOtp]
  );

  const updateName = useCallback((name: string) => {
    setAccount((prev) => (prev ? { ...prev, name } : prev));
  }, []);

  const logout = useCallback(() => {
    setAccount(null);
  }, []);

  const addOrder = useCallback((order: OrderRecord) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const value = useMemo(
    () => ({
      account,
      isLoggedIn: !!account,
      pendingPhone,
      demoOtp,
      requestOtp,
      verifyOtp,
      updateName,
      logout,
      orders,
      addOrder,
    }),
    [account, pendingPhone, demoOtp, requestOtp, verifyOtp, updateName, logout, orders, addOrder]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
