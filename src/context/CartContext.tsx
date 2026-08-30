import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CartItem, CartVariation, Product } from "../types";

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, name: string, quantity: number, variation?: CartVariation) => void;
  removeItem: (productId: string, variationId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variationId?: string) => void;
  clearCart: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "kala-search-cart";
export const resolveCartPrice = (product: Product, variation?: CartVariation) => variation?.price ?? product.price;

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback(
    (product: Product, name: string, quantity: number, variation?: CartVariation) => {
      setItems((prev) => {
        const existingIdx = prev.findIndex(
          (it) => it.productId === product.id && it.variation?.id === variation?.id
        );
        if (existingIdx >= 0) {
          const next = [...prev];
          next[existingIdx] = {
            ...next[existingIdx],
            quantity: next[existingIdx].quantity + quantity,
          };
          return next;
        }
        return [
          ...prev,
          {
            productId: product.id,
            name,
            image: product.image,
            price: resolveCartPrice(product, variation),
            quantity,
            variation,
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((productId: string, variationId?: string) => {
    setItems((prev) => prev.filter((it) => !(it.productId === productId && it.variation?.id === variationId)));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, variationId?: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.productId === productId && it.variation?.id === variationId
          ? { ...it, quantity: Math.max(1, quantity) }
          : it
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = useMemo(() => items.reduce((sum, it) => sum + (it.price ?? 0) * it.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((sum, it) => sum + it.quantity, 0), [items]);

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clearCart, total, count }),
    [items, addItem, removeItem, updateQuantity, clearCart, total, count]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      items: [],
      addItem: () => {},
      removeItem: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      total: 0,
      count: 0,
    };
  }
  return ctx;
}
