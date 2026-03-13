"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { WishlistItem } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface WishlistContextType {
  items: WishlistItem[];
  productIds: number[];
  count: number;
  loading: boolean;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

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

  const res = await fetch(`${BASE_URL}/${endpoint}`, opts);
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

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [productIds, setProductIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshWishlist = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setItems([]);
      setProductIds([]);
      return;
    }
    setLoading(true);
    try {
      // Fetch full items and check IDs in parallel
      const [fullData, idsData] = await Promise.all([
        authedFetch("wishlist"),
        authedFetch("wishlist/check"),
      ]);
      setItems(Array.isArray(fullData) ? fullData : []);
      setProductIds(Array.isArray(idsData) ? idsData : []);
    } catch {
      setItems([]);
      setProductIds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWishlist();

    const onAuthChange = () => refreshWishlist();
    window.addEventListener("auth-change", onAuthChange);
    window.addEventListener("storage", onAuthChange);
    return () => {
      window.removeEventListener("auth-change", onAuthChange);
      window.removeEventListener("storage", onAuthChange);
    };
  }, [refreshWishlist]);

  const isInWishlist = useCallback(
    (productId: number) => productIds.includes(productId),
    [productIds],
  );

  const toggleWishlist = useCallback(
    async (productId: number) => {
      if (productIds.includes(productId)) {
        await authedFetch(`wishlist/${productId}`, "DELETE");
      } else {
        await authedFetch("wishlist", "POST", { product_id: productId });
      }
      await refreshWishlist();
    },
    [productIds, refreshWishlist],
  );

  const removeFromWishlist = useCallback(
    async (productId: number) => {
      await authedFetch(`wishlist/${productId}`, "DELETE");
      await refreshWishlist();
    },
    [refreshWishlist],
  );

  const count = items.length;

  return (
    <WishlistContext.Provider
      value={{
        items,
        productIds,
        count,
        loading,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
