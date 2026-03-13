import { useState, useEffect } from "react";
import { Category } from "@/types";

interface UseCategoriesOptions {
  gender?: "men" | "women" | "unisex" | "";
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = "http://localhost:5000/api/categories";
        if (options.gender) {
          url += `?gender=${options.gender}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await res.json();
        setCategories(data);
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

    fetchCategories();
  }, [options.gender]);

  return { categories, loading, error };
}
