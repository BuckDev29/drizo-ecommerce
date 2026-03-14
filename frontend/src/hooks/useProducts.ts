import { useState, useEffect } from "react";
import { Product } from "@/types";
import { buildApiUrl } from "@/lib/api";

interface UseProductsOptions {
  category?: string;
  gender?: "men" | "women" | "unisex" | "";
  minPrice?: string;
  maxPrice?: string;
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = new URL(buildApiUrl("products"));
        if (options.category) url.searchParams.append("category", options.category);
        if (options.gender) url.searchParams.append("gender", options.gender);
        if (options.minPrice) url.searchParams.append("minPrice", options.minPrice);
        if (options.maxPrice) url.searchParams.append("maxPrice", options.maxPrice);

        const res = await fetch(url.toString());
        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await res.json();
        setProducts(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [options.category, options.gender, options.minPrice, options.maxPrice]);

  return { products, loading, error };
}
