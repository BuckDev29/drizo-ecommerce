"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Product } from "@/types";
import Link from "next/link";
import Loading from "@/components/Loading";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const SIZES = ["XS", "S", "M", "L", "XL"];

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
];

export default function ProductDetail() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [addedToBag, setAddedToBag] = useState(false);
  const [addingToBag, setAddingToBag] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:5000/api/products/${id}`);
        if (!res.ok) throw new Error("Producto no encontrado");
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  if (loading) return <Loading />;

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <p className="text-sm text-gray-500 tracking-[0.15em] uppercase">
          {error || "Producto no encontrado"}
        </p>
        <Link
          href="/products"
          className="text-xs tracking-[0.2em] uppercase underline text-black"
        >
          Volver a productos
        </Link>
      </div>
    );
  }

  const imageUrl =
    product.image_url || FALLBACK_IMAGES[product.id % FALLBACK_IMAGES.length];
  const formattedPrice = `$${Number(product.price).toLocaleString("es-CO")}`;

  const handleAddToBag = async () => {
    if (!selectedSize || !product) return;
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/auth";
      return;
    }
    setAddingToBag(true);
    try {
      await addToCart(product.id, 1);
      setAddedToBag(true);
      setTimeout(() => setAddedToBag(false), 2000);
    } catch (err) {
      console.error("Failed to add to bag", err);
    } finally {
      setAddingToBag(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/auth";
      return;
    }
    setTogglingWishlist(true);
    try {
      await toggleWishlist(product.id);
    } catch (err) {
      console.error("Failed to toggle wishlist", err);
    } finally {
      setTogglingWishlist(false);
    }
  };

  const inWishlist = product ? isInWishlist(product.id) : false;

  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col lg:flex-row">
        {/* ── Left: Product Image ── */}
        <div className="lg:w-[55%] xl:w-[60%] lg:sticky lg:top-[44px] lg:h-[calc(100vh-44px)]">
          <div className="aspect-[3/4] lg:aspect-auto lg:h-full w-full overflow-hidden bg-gray-50">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* ── Right: Product Info ── */}
        <div className="lg:w-[45%] xl:w-[40%] flex flex-col justify-center px-6 md:px-10 lg:px-14 xl:px-20 py-10 lg:py-16">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-gray-400 mb-8">
            <Link
              href="/"
              className="hover:text-black transition-colors text-gray-400"
            >
              Inicio
            </Link>
            <span>/</span>
            <Link
              href="/products"
              className="hover:text-black transition-colors text-gray-400"
            >
              Productos
            </Link>
            <span>/</span>
            <span className="text-gray-600">{product.name}</span>
          </div>

          {/* Product Name */}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-black leading-tight mb-3">
            {product.name}
          </h1>

          {/* Price */}
          <p className="text-lg md:text-xl font-medium text-black mb-6">
            {formattedPrice}
          </p>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              {product.description}
            </p>
          )}

          {/* Size Selector */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] tracking-[0.2em] uppercase font-medium text-black">
                Talla
              </span>
              {!selectedSize && (
                <span className="text-[10px] tracking-[0.15em] uppercase text-red-500">
                  Selecciona una talla
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-12 h-12 flex items-center justify-center text-[12px] tracking-[0.1em] font-medium border transition-all duration-200 ${
                    selectedSize === size
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-gray-300 hover:border-black"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Stock info */}
          {product.stock <= 5 && product.stock > 0 && (
            <p className="text-[11px] tracking-[0.15em] uppercase text-orange-600 mb-4">
              ¡Solo quedan {product.stock} unidades!
            </p>
          )}
          {product.stock === 0 && (
            <p className="text-[11px] tracking-[0.15em] uppercase text-red-600 mb-4">
              Agotado
            </p>
          )}

          {/* Add to Bag */}
          <button
            onClick={handleAddToBag}
            disabled={!selectedSize || product.stock === 0 || addingToBag}
            className={`w-full py-4 text-[12px] tracking-[0.2em] uppercase font-medium transition-all duration-200 mb-3 ${
              !selectedSize || product.stock === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : addedToBag
                  ? "bg-green-600 text-white"
                  : addingToBag
                    ? "bg-gray-800 text-white"
                    : "bg-black text-white hover:bg-gray-900"
            }`}
          >
            {product.stock === 0
              ? "Agotado"
              : addedToBag
                ? "✓ Añadido a la bolsa"
                : addingToBag
                  ? "Añadiendo..."
                  : "Añadir a la bolsa"}
          </button>

          {/* Add to Wishlist */}
          <button
            onClick={handleToggleWishlist}
            disabled={togglingWishlist}
            className={`w-full py-4 text-[12px] tracking-[0.2em] uppercase font-medium border transition-all duration-200 flex items-center justify-center gap-2 ${
              inWishlist
                ? "bg-black text-white border-black"
                : "bg-white text-black border-black hover:bg-gray-50"
            } disabled:opacity-50`}
          >
            <HeartIcon filled={inWishlist} />
            {togglingWishlist
              ? "..."
              : inWishlist
                ? "Añadido a wishlist"
                : "Añadir a wishlist"}
          </button>

          {/* Extra details */}
          <div className="mt-10 pt-8 border-t border-gray-200 space-y-4">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-[11px] tracking-[0.2em] uppercase font-medium text-black py-2">
                Envío y devoluciones
                <svg
                  className="w-4 h-4 transition-transform duration-200 group-open:rotate-180"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <div className="text-xs text-gray-500 leading-relaxed pb-4 pt-1">
                Envío gratis en pedidos mayores a $200.000 COP. Devoluciones
                gratis dentro de los 30 días posteriores a la entrega.
              </div>
            </details>
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-[11px] tracking-[0.2em] uppercase font-medium text-black py-2">
                Guía de tallas
                <svg
                  className="w-4 h-4 transition-transform duration-200 group-open:rotate-180"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </summary>
              <div className="text-xs text-gray-500 leading-relaxed pb-4 pt-1">
                XS: 32-34 | S: 36-38 | M: 40-42 | L: 44-46 | XL: 48-50. Si estás
                entre dos tallas, te recomendamos elegir la más grande.
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
