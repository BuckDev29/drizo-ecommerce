"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import Loading from "@/components/Loading";
import { useState } from "react";

const SIZES = ["XS", "S", "M", "L", "XL"];

export default function ProductList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categorySlug = searchParams.get("category") || "";

  const { categories } = useCategories();
  const categoryName =
    categories.find((c) => c.slug === categorySlug)?.name || categorySlug;

  const { products, loading, error } = useProducts({ category: categorySlug });
  const { addToCart } = useCart();

  // Track which product just got added (for brief "Añadido" feedback)
  const [addedMap, setAddedMap] = useState<Record<number, string>>({});

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="flex justify-center py-20 min-h-[50vh] items-center text-[var(--color-text-secondary)]">
        Failed to load products: {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 min-h-[50vh] text-[var(--color-text-secondary)]">
        <h2 className="text-xl md:text-2xl font-light mb-4 text-black tracking-wide">
          {categoryName ? categoryName.toUpperCase() : "PRODUCTS"}
        </h2>
        <p className="tracking-wide uppercase text-sm">
          No products found in this category.
        </p>
      </div>
    );
  }

  // Aesthetic fallbacks if DB lacks image
  const enrichedProducts = products.map((prod, index) => {
    if (prod.image_url) {
      return { ...prod, image: prod.image_url };
    }
    const fallbacks = [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?q=80&w=600&auto=format&fit=crop",
    ];
    return { ...prod, image: fallbacks[index % fallbacks.length] };
  });

  return (
    <div className="px-4 md:px-0 py-12 md:py-16 pt-24 md:pt-0 min-h-screen">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-1 md:gap-y-1">
        {enrichedProducts.map((product) => {
          const added = addedMap[product.id];

          const handleSizeClick = async (e: React.MouseEvent, size: string) => {
            e.preventDefault();
            e.stopPropagation();

            const token = localStorage.getItem("token");
            if (!token) {
              router.push("/auth");
              return;
            }

            try {
              await addToCart(product.id, 1);
              setAddedMap((prev) => ({ ...prev, [product.id]: size }));
              setTimeout(() => {
                setAddedMap((prev) => {
                  const copy = { ...prev };
                  delete copy[product.id];
                  return copy;
                });
              }, 1800);
            } catch {
              /* handled by context */
            }
          };

          return (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group cursor-pointer flex flex-col no-underline"
            >
              <div className="relative aspect-[2.5/4] overflow-hidden bg-gray-100 mb-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover block"
                />

                {/* Size overlay — only bottom portion */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-[2px] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out flex flex-col items-center py-4 pointer-events-none group-hover:pointer-events-auto">
                  {added ? (
                    <div className="flex flex-col items-center gap-2 animate-[fadeIn_0.2s_ease]">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-white text-[10px] uppercase tracking-[0.2em]">
                        Talla {added} añadida
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="text-white text-[10px] uppercase tracking-[0.2em] mb-3">
                        Elige la talla
                      </span>
                      <div className="flex gap-1.5">
                        {SIZES.map((size) => (
                          <button
                            key={size}
                            onClick={(e) => handleSizeClick(e, size)}
                            className="w-9 h-9 border border-white/60 text-white text-[11px] tracking-wider uppercase bg-transparent hover:bg-white hover:text-black transition-colors duration-200 cursor-pointer flex items-center justify-center"
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-0 mt-2 px-3 pb-2">
                <h3 className="text-xs md:text-xs font-small text-black tracking-wide truncate">
                  {product.name}
                </h3>

                <p className="text-xs md:text-xs text-[var(--color-text-primary)]">
                  ${Number(product.price).toLocaleString("es-CO")}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
