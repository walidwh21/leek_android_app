import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const CART_KEY = "leek_cart_v1";

export type CartLine = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  unit: string;
  quantity: number;
  maxQty: number;
};

type CartContextValue = {
  items: CartLine[];
  hydrated: boolean;
  addItem: (line: Omit<CartLine, "quantity"> & { quantity?: number }) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

async function loadCart(): Promise<CartLine[]> {
  try {
    const raw = await AsyncStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void loadCart().then((loaded) => {
      setItems(loaded);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((line: Omit<CartLine, "quantity"> & { quantity?: number }) => {
    const qty = Math.max(1, line.quantity ?? 1);
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.productId === line.productId);
      if (idx === -1) {
        const nextQty = Math.min(qty, line.maxQty);
        return [...prev, { ...line, quantity: nextQty }];
      }
      const cur = prev[idx]!;
      const merged = Math.min(cur.quantity + qty, line.maxQty);
      const next = [...prev];
      next[idx] = { ...cur, ...line, quantity: merged };
      return next;
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      const q = Math.floor(quantity);
      if (q < 1) return prev.filter((p) => p.productId !== productId);
      return prev.map((p) =>
        p.productId === productId ? { ...p, quantity: Math.min(q, p.maxQty) } : p,
      );
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((p) => p.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((s, l) => s + l.price * l.quantity, 0);
    const count = items.reduce((s, l) => s + l.quantity, 0);
    return {
      items,
      hydrated,
      addItem,
      setQuantity,
      removeItem,
      clear,
      subtotal,
      count,
    };
  }, [items, hydrated, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
