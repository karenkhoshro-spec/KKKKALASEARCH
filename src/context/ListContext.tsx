import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ListContextType } from "../types";

interface ListContextValue {
  listContext: ListContextType;
  setListContext: (ctx: ListContextType) => void;
  contextPath: (ctx?: ListContextType) => string;
}

const ListContext = createContext<ListContextValue | null>(null);

export function listContextToPath(ctx: ListContextType): string {
  switch (ctx.type) {
    case "search":
      return `/search?q=${encodeURIComponent(ctx.query)}`;
    case "category":
      return `/category/${ctx.categoryId}`;
    case "products":
      return "/products";
    case "wishlist":
      return "/wishlist";
    default:
      return "/";
  }
}

export function ListContextProvider({ children }: { children: ReactNode }) {
  const [listContext, setListContext] = useState<ListContextType>({ type: "home" });

  const contextPath = useCallback(
    (ctx?: ListContextType) => listContextToPath(ctx ?? listContext),
    [listContext]
  );

  const value = useMemo(() => ({ listContext, setListContext, contextPath }), [listContext, contextPath]);

  return <ListContext.Provider value={value}>{children}</ListContext.Provider>;
}

export function useListContext() {
  const ctx = useContext(ListContext);
  if (!ctx) throw new Error("useListContext must be used within ListContextProvider");
  return ctx;
}
