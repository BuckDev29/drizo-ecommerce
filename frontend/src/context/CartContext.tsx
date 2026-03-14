"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { CartItem } from "@/types";
import { buildApiUrl } from "@/lib/api";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  loading: boolean;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function authedFetch(endpoint: string, method = "GET", body?: any) {
  const token = getToken();
  if (!token) throw new Error("No token");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  const opts: RequestInit = { method, headers };

  if (body) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(buildApiUrl(endpoint), opts);
  const data = await res.json();
  if (!res.ok) {
    const msg = (data.message || "").toLowerCase();
    if (
      res.status === 401 ||
      msg.includes("invalid token") ||
      msg.includes("unauthorized")
    ) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth-change"));
    }
    throw new Error(data.message || "Error");
  }
  return data;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await authedFetch("cart");
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch cart on mount and when auth changes
  useEffect(() => {
    refreshCart();

    const onAuthChange = () => refreshCart();
    window.addEventListener("auth-change", onAuthChange);
    window.addEventListener("storage", onAuthChange);
    return () => {
      window.removeEventListener("auth-change", onAuthChange);
      window.removeEventListener("storage", onAuthChange);
    };
  }, [refreshCart]);

  const addToCart = useCallback(
    async (productId: number, quantity = 1) => {
      await authedFetch("cart", "POST", { product_id: productId, quantity });
      await refreshCart();
    },
    [refreshCart],
  );

  const updateQuantity = useCallback(
    async (cartItemId: number, quantity: number) => {
      if (quantity <= 0) {
        await authedFetch(`cart/${cartItemId}`, "DELETE");
      } else {
        await authedFetch(`cart/${cartItemId}`, "PUT", { quantity });
      }
      await refreshCart();
    },
    [refreshCart],
  );

  const removeItem = useCallback(
    async (cartItemId: number) => {
      await authedFetch(`cart/${cartItemId}`, "DELETE");
      await refreshCart();
    },
    [refreshCart],
  );

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce(
    (sum, i) => sum + Number(i.price || 0) * i.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
