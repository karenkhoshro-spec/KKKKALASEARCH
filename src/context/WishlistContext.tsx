import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

interface WishlistContextValue {
  ids: string[];
  toggle: (id: string) => boolean;
  isSaved: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "kala-search-wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  const toggle = useCallback((id: string) => {
    let added = false;
    setIds((prev) => {
      if (prev.includes(id)) {
        added = false;
        return prev.filter((x) => x !== id);
      }
      added = true;
      return [...prev, id];
    });
    return added;
  }, []);

  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);

  const value = useMemo(() => ({ ids, toggle, isSaved }), [ids, toggle, isSaved]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    return {
      ids: [] as string[],
      toggle: () => false,
      isSaved: () => false,
    };
  }
  return ctx;
}
