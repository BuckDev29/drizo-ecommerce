"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { buildApiUrl } from "@/lib/api";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";

/* ═══════════════════════════════════════════════════════════
   Icon SVGs
   ═══════════════════════════════════════════════════════════ */
const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);
const HeartIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const BagIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);
const UserIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const CloseIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const PlusIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════
   CSS-in-JS styles (injected via <style>)
   ═══════════════════════════════════════════════════════════ */
const headerStyles = `
  /* ── Hamburger animation ── */
  .drizo-burger span {
    display: block;
    width: 20px;
    height: 1.5px;
    background: currentColor;
    transition: all 0.35s cubic-bezier(0.25, 0.1, 0.25, 1);
    transform-origin: center;
  }
  .drizo-burger.is-open span:nth-child(1) {
    transform: translateY(6px) rotate(45deg);
  }
  .drizo-burger.is-open span:nth-child(2) {
    opacity: 0;
    transform: scaleX(0);
  }
  .drizo-burger.is-open span:nth-child(3) {
    transform: translateY(-6px) rotate(-45deg);
  }
`;

/* ═══════════════════════════════════════════════════════════
   Mobile Menu Panel (slide from left)
   ═══════════════════════════════════════════════════════════ */
function MenuPanel({
  open,
  onClose,
  isLoggedIn,
}: {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}) {
  const navItems = [
    { label: "Mujer", href: "/categories?gender=women", expandable: true },
    { label: "Hombre", href: "/categories?gender=men", expandable: true },
    { label: "Unisex", href: "/products", expandable: true },
    { label: "Novedades", href: "/" },
    { label: "Community Rewards", href: "/" },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 transition-opacity duration-400 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-[380px] max-w-[90vw] bg-white z-[70] flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ boxShadow: open ? "8px 0 40px rgba(0,0,0,0.12)" : "none" }}
      >
        <div className="flex items-center justify-between px-7 py-6">
          <Link
            href="/"
            onClick={onClose}
            className="text-2xl font-bold tracking-tight text-black font-['EtermalDemo']"
          >
            drizo
          </Link>
          <button
            aria-label="Cerrar menú"
            onClick={onClose}
            className="drizo-icon-btn text-black p-1"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-7 h-px bg-gray-200" />

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <div key={item.label}>
              <Link
                href={item.href}
                onClick={onClose}
                className="flex items-center justify-between w-full px-7 py-4 text-[13px] font-medium text-black hover:bg-gray-50 transition-colors tracking-[0.15em] uppercase"
              >
                {item.label}
                {item.expandable && (
                  <span className="text-gray-400">
                    <PlusIcon />
                  </span>
                )}
              </Link>
              <div className="mx-7 h-px bg-gray-100" />
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100">
          <Link
            href={isLoggedIn ? "/profile" : "/auth"}
            onClick={onClose}
            className="flex items-center gap-3 px-7 py-4 text-[13px] font-medium text-black hover:bg-gray-50 transition-colors tracking-[0.15em] uppercase"
          >
            <UserIcon />
            {isLoggedIn ? "Mi Perfil" : "Iniciar sesión"}
          </Link>
          <div className="flex items-center gap-2 px-7 py-4 text-xs text-gray-400 tracking-wider">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            COLOMBIA (COP $)
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   Bag Drawer (real cart)
   ═══════════════════════════════════════════════════════════ */
const MinusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const PlusSmIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const TrashIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=300&auto=format&fit=crop";

function BagDrawer({
  open,
  onClose,
  isLoggedIn,
}: {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}) {
  const { items, itemCount, total, loading, updateQuantity, removeItem } =
    useCart();
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleQty = async (id: number, qty: number) => {
    setUpdatingId(id);
    try {
      await updateQuantity(id, qty);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (id: number) => {
    setUpdatingId(id);
    try {
      await removeItem(id);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-[420px] max-w-[95vw] bg-white z-[70] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-[13px] font-medium tracking-[0.15em] text-black uppercase">
            Bolsa{itemCount > 0 && ` (${itemCount})`}
          </h2>
          <button
            onClick={onClose}
            className="drizo-icon-btn text-black"
            aria-label="Cerrar bolsa"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!isLoggedIn ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 px-6">
              <div className="text-gray-200">
                <BagIcon />
              </div>
              <p className="text-[12px] font-medium text-gray-700 tracking-[0.15em] text-center uppercase">
                Tu bolsa está vacía
              </p>
              <p className="text-xs text-gray-400 text-center leading-relaxed max-w-[260px]">
                Inicia sesión para ver y gestionar tu bolsa.
              </p>
              <Link
                href="/auth"
                onClick={onClose}
                className="w-full max-w-[260px] text-center py-3.5 bg-black text-white text-[11px] uppercase tracking-[0.2em] hover:bg-gray-900 transition-colors"
              >
                Iniciar sesión
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-[11px] font-medium text-gray-400 tracking-[0.2em] uppercase">
                Tu bolsa está vacía
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 px-6 py-5 border-b border-gray-100"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/products/${item.product_id}`}
                    onClick={onClose}
                    className="w-[90px] h-[120px] flex-shrink-0 bg-gray-100 overflow-hidden"
                  >
                    <img
                      src={item.image_url || FALLBACK_IMG}
                      alt={item.name || "Producto"}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <Link
                        href={`/products/${item.product_id}`}
                        onClick={onClose}
                        className="text-[12px] font-medium text-black tracking-wide uppercase leading-tight line-clamp-2 hover:underline"
                      >
                        {item.name || "Producto"}
                      </Link>
                      <p className="text-[12px] text-gray-500 mt-1">
                        ${Number(item.price || 0).toLocaleString("es-CO")}
                      </p>
                    </div>

                    {/* Quantity + Remove */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200">
                        <button
                          onClick={() => handleQty(item.id, item.quantity - 1)}
                          disabled={updatingId === item.id}
                          className="w-8 h-8 flex items-center justify-center text-black hover:bg-gray-50 transition-colors disabled:opacity-40"
                          aria-label="Reducir cantidad"
                        >
                          <MinusIcon />
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center text-[12px] font-medium text-black border-x border-gray-200">
                          {updatingId === item.id ? "·" : item.quantity}
                        </span>
                        <button
                          onClick={() => handleQty(item.id, item.quantity + 1)}
                          disabled={updatingId === item.id}
                          className="w-8 h-8 flex items-center justify-center text-black hover:bg-gray-50 transition-colors disabled:opacity-40"
                          aria-label="Aumentar cantidad"
                        >
                          <PlusSmIcon />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={updatingId === item.id}
                        className="p-1.5 text-gray-400 hover:text-black transition-colors disabled:opacity-40"
                        aria-label="Eliminar"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer — total + checkout */}
        {isLoggedIn && items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase tracking-[0.15em] text-gray-500">
                Subtotal
              </span>
              <span className="text-[14px] font-semibold text-black">
                ${total.toLocaleString("es-CO")}
              </span>
            </div>
            <button
              onClick={() => {
                router.push("/checkout");
                onClose();
              }}
              className="w-full py-3.5 bg-black text-white text-[11px] uppercase tracking-[0.2em] hover:bg-gray-900 transition-colors"
            >
              Finalizar compra
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   Wishlist Drawer (real data)
   ═══════════════════════════════════════════════════════════ */
function WishlistDrawer({
  open,
  onClose,
  isLoggedIn,
}: {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}) {
  const { items, count, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [actionId, setActionId] = useState<number | null>(null);

  const handleRemove = async (productId: number) => {
    setActionId(productId);
    try {
      await removeFromWishlist(productId);
    } finally {
      setActionId(null);
    }
  };

  const handleMoveToBag = async (productId: number) => {
    setActionId(productId);
    try {
      await addToCart(productId, 1);
      await removeFromWishlist(productId);
    } catch (err) {
      console.error("Failed to move to bag", err);
    } finally {
      setActionId(null);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-[420px] max-w-[95vw] bg-white z-[70] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-[13px] font-medium tracking-[0.15em] text-black uppercase">
            Wishlist{count > 0 && ` (${count})`}
          </h2>
          <button
            onClick={onClose}
            className="drizo-icon-btn text-black"
            aria-label="Cerrar wishlist"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!isLoggedIn ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 px-6">
              <div className="text-gray-200">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <p className="text-[12px] font-medium text-gray-700 tracking-[0.15em] text-center uppercase">
                Tu wishlist está vacía
              </p>
              <p className="text-xs text-gray-400 text-center leading-relaxed max-w-[260px]">
                Inicia sesión para guardar tus favoritos y acceder a ellos desde
                cualquier dispositivo.
              </p>
              <Link
                href="/auth"
                onClick={onClose}
                className="w-full max-w-[260px] text-center py-3.5 bg-black text-white text-[11px] uppercase tracking-[0.2em] hover:bg-gray-900 transition-colors"
              >
                Iniciar sesión
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
              <div className="text-gray-200">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <p className="text-[11px] font-medium text-gray-400 tracking-[0.2em] uppercase">
                Tu wishlist está vacía
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {items.map((item) => (
                <div
                  key={item.id || item.product_id}
                  className="flex gap-4 px-6 py-5 border-b border-gray-100"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/products/${item.product_id}`}
                    onClick={onClose}
                    className="w-[90px] h-[120px] flex-shrink-0 bg-gray-100 overflow-hidden"
                  >
                    <img
                      src={item.image_url || FALLBACK_IMG}
                      alt={item.name || "Producto"}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <Link
                        href={`/products/${item.product_id}`}
                        onClick={onClose}
                        className="text-[12px] font-medium text-black tracking-wide uppercase leading-tight line-clamp-2 hover:underline"
                      >
                        {item.name || "Producto"}
                      </Link>
                      <p className="text-[12px] text-gray-500 mt-1">
                        ${Number(item.price || 0).toLocaleString("es-CO")}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleMoveToBag(item.product_id)}
                        disabled={actionId === item.product_id}
                        className="flex-1 py-2 bg-black text-white text-[10px] uppercase tracking-[0.15em] hover:bg-gray-900 transition-colors disabled:opacity-40"
                      >
                        {actionId === item.product_id ? "···" : "Mover a bolsa"}
                      </button>
                      <button
                        onClick={() => handleRemove(item.product_id)}
                        disabled={actionId === item.product_id}
                        className="p-2 text-gray-400 hover:text-black transition-colors disabled:opacity-40"
                        aria-label="Eliminar de wishlist"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   Search Drawer
   ═══════════════════════════════════════════════════════════ */
function SearchDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 350);
    } else {
      setQuery("");
      setResults([]);
      setSearching(false);
    }
  }, [open]);

  const searchProducts = useCallback(async (term: string) => {
    if (term.trim().length === 0) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(buildApiUrl("products"));
      if (!res.ok) throw new Error();
      const all: Product[] = await res.json();
      const lower = term.toLowerCase();
      const filtered = all.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.description?.toLowerCase().includes(lower),
      );
      setResults(filtered);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProducts(val), 300);
  };

  const hasQuery = query.trim().length > 0;

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-[420px] max-w-[95vw] bg-white z-[70] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-[13px] font-medium tracking-[0.15em] text-black uppercase">
            Buscar
          </h2>
          <button
            onClick={onClose}
            className="drizo-icon-btn text-black"
            aria-label="Cerrar búsqueda"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-6 py-6 border-b border-gray-100">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              placeholder="¿QUÉ ESTÁS BUSCANDO?"
              className="w-full bg-gray-100 text-black text-[11px] uppercase tracking-[0.15em] py-3 pl-10 pr-4 outline-none focus:ring-1 focus:ring-black placeholder:text-gray-400"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!hasQuery && (
            <>
              <p className="text-[11px] text-gray-400 tracking-[0.1em] uppercase mb-4">
                Sugerencias
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/categories?gender=women"
                  onClick={onClose}
                  className="text-[12px] font-medium text-black hover:text-gray-600 transition-colors uppercase tracking-wider"
                >
                  Mujer
                </Link>
                <Link
                  href="/categories?gender=men"
                  onClick={onClose}
                  className="text-[12px] font-medium text-black hover:text-gray-600 transition-colors uppercase tracking-wider"
                >
                  Hombre
                </Link>
              </div>
            </>
          )}

          {hasQuery && searching && (
            <div className="flex items-center justify-center py-12">
              <div className="w-5 h-5 border border-black border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {hasQuery && !searching && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-[11px] text-gray-400 tracking-[0.1em] uppercase">
                No se encontraron resultados para
              </p>
              <p className="text-[12px] text-black tracking-wider uppercase mt-1">
                &ldquo;{query}&rdquo;
              </p>
            </div>
          )}

          {hasQuery && !searching && results.length > 0 && (
            <>
              <p className="text-[11px] text-gray-400 tracking-[0.1em] uppercase mb-4">
                {results.length} resultado{results.length !== 1 ? "s" : ""}
              </p>
              <div className="flex flex-col gap-4">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    onClick={onClose}
                    className="flex gap-4 group no-underline"
                  >
                    <div className="w-16 h-20 flex-shrink-0 bg-gray-100 overflow-hidden">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <h4 className="text-[12px] font-medium text-black tracking-wider uppercase truncate group-hover:text-gray-600 transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        ${Number(product.price).toLocaleString("es-CO")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main Header
   ═══════════════════════════════════════════════════════════ */
export default function Header() {
  const pathname = usePathname();
  const [bagOpen, setBagOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));

    // Opcional: escuchar cambios en localStorage si hacemos login/logout en otra pestaña
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-change", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-change", handleStorageChange);
    };
  }, []);

  const isHome = pathname === "/";

  // Hide on auth pages
  if (
    pathname === "/login" ||
    pathname === "/auth" ||
    pathname === "/register"
  ) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: headerStyles }} />

      {/* ── Main Header ── */}
      <header
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          backgroundColor: isHome ? "transparent" : "#000000",
          color: "white",
        }}
      >
        <div className="flex items-center justify-between px-5 md:px-8 h-[44px]">
          {/* Left — Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-[1.4rem] md:text-[1.6rem] font-bold tracking-[0.02em] font-['EtermalDemo'] no-underline text-white"
            >
              drizo
            </Link>
            <nav className="hidden md:flex items-center gap-5">
              <Link
                href="/categories?gender=men"
                className="text-[11px] tracking-[0.15em] uppercase font-medium text-white/80 hover:text-white transition-colors"
              >
                Hombre
              </Link>
              <Link
                href="/categories?gender=women"
                className="text-[11px] tracking-[0.15em] uppercase font-medium text-white/80 hover:text-white transition-colors"
              >
                Mujer
              </Link>
            </nav>
          </div>

          {/* Right — Action icons */}
          <div className="flex items-center gap-1 text-white">
            <button
              onClick={() => {
                setSearchOpen(true);
                setWishlistOpen(false);
                setBagOpen(false);
              }}
              aria-label="Buscar"
              className="p-2"
            >
              <SearchIcon />
            </button>
            <button
              onClick={() => {
                setWishlistOpen(true);
                setBagOpen(false);
                setSearchOpen(false);
              }}
              aria-label="Wishlist"
              className="p-2 relative"
            >
              <HeartIcon />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-white text-black text-[9px] font-bold rounded-full leading-none px-1">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setBagOpen(true);
                setWishlistOpen(false);
                setSearchOpen(false);
              }}
              aria-label="Bolsa"
              className="p-2 relative"
            >
              <BagIcon />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-white text-black text-[9px] font-bold rounded-full leading-none px-1">
                  {itemCount}
                </span>
              )}
            </button>
            <Link
              href={isLoggedIn ? "/profile" : "/auth"}
              className="p-2 hidden md:flex items-center gap-1.5 text-white"
              aria-label="Cuenta"
            >
              <UserIcon />
              <span className="text-[10px] tracking-[0.1em] uppercase font-medium">
                {isLoggedIn ? "Perfil" : "Iniciar sesión"}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {!isHome && <div style={{ height: "44px" }} />}

      <BagDrawer
        open={bagOpen}
        onClose={() => setBagOpen(false)}
        isLoggedIn={isLoggedIn}
      />
      <WishlistDrawer
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        isLoggedIn={isLoggedIn}
      />
      <SearchDrawer open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
