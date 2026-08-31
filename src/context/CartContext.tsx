import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CartItem, CartVariation, Product } from "../types";

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, name: string, quantity: number, variation?: CartVariation) => void;
  removeItem: (productId: string, variationId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variationId?: string) => void;
  /** Sets the exact quantity of a line; qty <= 0 removes the line entirely. */
  setQuantity: (productId: string, variationId: string | undefined, quantity: number) => void;
  /** How many units of (productId + variation) are currently in the cart. */
  qtyInCart: (productId: string, variationId?: string) => number;
  clearCart: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "kala-search-cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Cart line identity: productId + variation.id (+ color/selection stored on
 * the line). The same product in two different colors is TWO lines.
 */
function sameLine(item: CartItem, productId: string, variationId?: string) {
  return item.productId === productId && (item.variation?.id ?? undefined) === variationId;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback(
    (product: Product, name: string, quantity: number, variation?: CartVariation) => {
      setItems((prev) => {
        const existingIdx = prev.findIndex((it) => sameLine(it, product.id, variation?.id));
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
            price: product.price,
            quantity,
            productCode: product.productCode,
            sku: product.sku,
            model: product.model,
            variation,
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((productId: string, variationId?: string) => {
    setItems((prev) => prev.filter((it) => !sameLine(it, productId, variationId)));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, variationId?: string) => {
    setItems((prev) =>
      prev.map((it) =>
        sameLine(it, productId, variationId) ? { ...it, quantity: Math.max(1, quantity) } : it
      )
    );
  }, []);

  const setQuantity = useCallback((productId: string, variationId: string | undefined, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((it) => !sameLine(it, productId, variationId))
        : prev.map((it) => (sameLine(it, productId, variationId) ? { ...it, quantity } : it))
    );
  }, []);

  const qtyInCart = useCallback(
    (productId: string, variationId?: string) => {
      const line = items.find((it) => sameLine(it, productId, variationId));
      return line ? line.quantity : 0;
    },
    [items]
  );

  const clearCart = useCallback(() => setItems([]), []);

  const total = useMemo(() => items.reduce((sum, it) => sum + it.price * it.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((sum, it) => sum + it.quantity, 0), [items]);

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, setQuantity, qtyInCart, clearCart, total, count }),
    [items, addItem, removeItem, updateQuantity, setQuantity, qtyInCart, clearCart, total, count]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
