"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useApiRequest from "@/hooks/useApiRequest";
import Loading from "@/components/Loading";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LowStockProduct {
  id: number;
  name: string;
  stock: number;
}

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: string | number;
  lowStockProducts: LowStockProduct[];
}

interface AdminOrder {
  id: number;
  user_name: string;
  user_email: string;
  status: string;
  payment_method: string;
  payment_status: string;
  total_price: string;
  created_at: string;
  street: string;
  city: string;
  country: string;
}

interface AdminOrderDetail extends AdminOrder {
  state: string;
  zip_code: string;
  notes?: string;
  items: {
    product_id: number;
    name: string;
    quantity: number;
    unit_price: string;
    image_url: string;
  }[];
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface AdminProduct {
  id: number;
  name: string;
  price: string;
  stock: number;
  category_id: number;
  image_url: string;
  description: string;
}

interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  gender: string;
  image_url?: string;
}

type Tab = "dashboard" | "users" | "products" | "categories" | "orders";

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-500 border-red-200",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "En proceso",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const { apiRequest, loading } = useApiRequest();
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // Data
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersFilter, setOrdersFilter] = useState("");
  const [orderDetail, setOrderDetail] = useState<AdminOrderDetail | null>(null);
  const [orderStatusForm, setOrderStatusForm] = useState({
    status: "",
    payment_status: "",
  });

  // UI state
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // User edit modal
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: "",
    email: "",
    role: "",
  });

  // Product edit modal
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category_id: "",
    image_url: "",
  });
  const [showNewProduct, setShowNewProduct] = useState(false);

  // Category edit modal
  const [editCategory, setEditCategory] = useState<AdminCategory | null>(null);
  const [editCategoryForm, setEditCategoryForm] = useState({
    name: "",
    slug: "",
    gender: "",
    image_url: "",
  });
  const [showNewCategory, setShowNewCategory] = useState(false);

  // ─── Load everything ────────────────────────────────────────────────────────

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/auth");
      return;
    }
    const load = async () => {
      try {
        const [s, u, p, c, o] = await Promise.all([
          apiRequest("admin/stats", true, "GET", null, false, false, token),
          apiRequest("admin/users", true, "GET", null, false, false, token),
          apiRequest("products", true, "GET", null, false, false, token),
          apiRequest("categories", false, "GET"),
          apiRequest("admin/orders", true, "GET", null, false, false, token),
        ]);
        setStats(s);
        setUsers(u);
        setProducts(Array.isArray(p) ? p : (p.products ?? []));
        setCategories(c);
        setOrders(Array.isArray(o) ? o : []);
      } catch (err: any) {
        const msg = (err.message || "").toLowerCase();
        if (
          msg.includes("unauthorized") ||
          msg.includes("invalid token") ||
          msg.includes("no tienes")
        ) {
          router.replace("/auth");
          return;
        }
        setError(err.message || "Error al cargar datos");
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [router]);

  // ─── Users ──────────────────────────────────────────────────────────────────

  const openEditUser = (u: AdminUser) => {
    setEditUser(u);
    setEditUserForm({ name: u.name, email: u.email, role: u.role });
  };

  const handleSaveUser = async () => {
    if (!editUser) return;
    setActionLoading(true);
    try {
      const updated = await apiRequest(
        `admin/users/${editUser.id}`,
        true,
        "PUT",
        editUserForm,
        false,
        false,
        getToken(),
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? { ...u, ...editUserForm } : u)),
      );
      setEditUser(null);
    } catch (err: any) {
      alert(err.message || "Error al actualizar usuario");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    setActionLoading(true);
    try {
      await apiRequest(
        `admin/users/${id}`,
        true,
        "DELETE",
        null,
        false,
        false,
        getToken(),
      );
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      alert(err.message || "Error al eliminar usuario");
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Products ───────────────────────────────────────────────────────────────

  const openEditProduct = (p: AdminProduct) => {
    setEditProduct(p);
    setEditProductForm({
      name: p.name,
      description: p.description,
      price: p.price,
      stock: String(p.stock),
      category_id: String(p.category_id),
      image_url: p.image_url,
    });
  };

  const handleSaveProduct = async () => {
    if (!editProduct) return;
    setActionLoading(true);
    try {
      await apiRequest(
        `products/${editProduct.id}`,
        true,
        "PUT",
        {
          ...editProductForm,
          price: parseFloat(editProductForm.price),
          stock: parseInt(editProductForm.stock),
          category_id: parseInt(editProductForm.category_id),
        },
        false,
        false,
        getToken(),
      );
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editProduct.id
            ? {
                ...p,
                ...editProductForm,
                price: editProductForm.price,
                stock: parseInt(editProductForm.stock),
                category_id: parseInt(editProductForm.category_id),
              }
            : p,
        ),
      );
      setEditProduct(null);
    } catch (err: any) {
      alert(err.message || "Error al actualizar producto");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("¿Eliminar este producto?")) return;
    setActionLoading(true);
    try {
      await apiRequest(
        `products/${id}`,
        true,
        "DELETE",
        null,
        false,
        false,
        getToken(),
      );
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (stats) setStats({ ...stats, totalProducts: stats.totalProducts - 1 });
    } catch (err: any) {
      alert(err.message || "Error al eliminar producto");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const created = await apiRequest(
        "products",
        true,
        "POST",
        {
          ...editProductForm,
          price: parseFloat(editProductForm.price),
          stock: parseInt(editProductForm.stock),
          category_id: parseInt(editProductForm.category_id),
        },
        false,
        false,
        getToken(),
      );
      setProducts((prev) => [...prev, created]);
      if (stats) setStats({ ...stats, totalProducts: stats.totalProducts + 1 });
      setShowNewProduct(false);
      setEditProductForm({
        name: "",
        description: "",
        price: "",
        stock: "",
        category_id: "",
        image_url: "",
      });
    } catch (err: any) {
      alert(err.message || "Error al crear producto");
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Orders ──────────────────────────────────────────────────────────────────

  const openOrderDetail = async (id: number) => {
    try {
      const data = await apiRequest(
        `admin/orders/${id}`,
        true,
        "GET",
        null,
        false,
        false,
        getToken(),
      );
      setOrderDetail(data);
      setOrderStatusForm({
        status: data.status,
        payment_status: data.payment_status,
      });
    } catch (err: any) {
      alert(err.message || "Error al cargar la orden");
    }
  };

  const handleUpdateOrderStatus = async () => {
    if (!orderDetail) return;
    setActionLoading(true);
    try {
      await apiRequest(
        `admin/orders/${orderDetail.id}/status`,
        true,
        "PUT",
        orderStatusForm,
        false,
        false,
        getToken(),
      );
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderDetail.id
            ? {
                ...o,
                status: orderStatusForm.status,
                payment_status: orderStatusForm.payment_status,
              }
            : o,
        ),
      );
      setOrderDetail(null);
    } catch (err: any) {
      alert(err.message || "Error al actualizar estado");
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Categories ─────────────────────────────────────────────────────────────

  const openEditCategory = (c: AdminCategory) => {
    setEditCategory(c);
    setEditCategoryForm({
      name: c.name,
      slug: c.slug,
      gender: c.gender,
      image_url: c.image_url || "",
    });
  };

  const handleSaveCategory = async () => {
    if (!editCategory) return;
    setActionLoading(true);
    try {
      await apiRequest(
        `categories/${editCategory.id}`,
        true,
        "PUT",
        editCategoryForm,
        false,
        false,
        getToken(),
      );
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editCategory.id ? { ...c, ...editCategoryForm } : c,
        ),
      );
      setEditCategory(null);
    } catch (err: any) {
      alert(err.message || "Error al actualizar categoría");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    setActionLoading(true);
    try {
      await apiRequest(
        `categories/${id}`,
        true,
        "DELETE",
        null,
        false,
        false,
        getToken(),
      );
      setCategories((prev) => prev.filter((c) => c.id !== id));
      if (stats)
        setStats({ ...stats, totalCategories: stats.totalCategories - 1 });
    } catch (err: any) {
      alert(err.message || "Error al eliminar categoría");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const created = await apiRequest(
        "categories",
        true,
        "POST",
        editCategoryForm,
        false,
        false,
        getToken(),
      );
      setCategories((prev) => [...prev, created]);
      if (stats)
        setStats({ ...stats, totalCategories: stats.totalCategories + 1 });
      setShowNewCategory(false);
      setEditCategoryForm({ name: "", slug: "", gender: "", image_url: "" });
    } catch (err: any) {
      alert(err.message || "Error al crear categoría");
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (initialLoading) return <Loading fullScreen />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pt-20">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "users", label: "Usuarios" },
    { key: "products", label: "Productos" },
    { key: "categories", label: "Categorías" },
    { key: "orders", label: "Órdenes" },
  ];

  return (
    <div className="min-h-screen bg-white pt-40 pb-20 px-6 md:px-12 lg:px-20">
      <div className="flex flex-col md:flex-row w-full h-full relative">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col md:absolute md:left-0 md:top-0">
          <div className="mb-12">
            <h2 className="text-3xl font-medium text-black tracking-tight mb-2">
              Admin
            </h2>
            <p className="text-[13px] text-gray-500 tracking-wide">
              Panel de administración
            </p>
          </div>

          <nav className="flex flex-col gap-6">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`text-left text-[14px] transition-colors ${
                  activeTab === t.key
                    ? "text-black font-medium"
                    : "text-gray-400 hover:text-black"
                }`}
              >
                {t.label}
              </button>
            ))}

            <div className="border-t border-gray-100 pt-6 mt-2">
              <button
                onClick={() => router.push("/profile")}
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] font-medium text-black border border-black px-4 py-2.5 hover:bg-black hover:text-white transition-colors w-full justify-center"
              >
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
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                Volver al perfil
              </button>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-[400px] flex items-start justify-center pt-24 md:pt-0 w-full">
          <div className="w-full max-w-3xl flex flex-col px-4 md:px-0">
            {/* ── Dashboard ──────────────────────────────────────────────── */}
            {activeTab === "dashboard" && stats && (
              <div className="w-full flex flex-col">
                <h3 className="text-2xl font-medium text-black mb-12">
                  Dashboard
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {[
                    { label: "Órdenes", value: stats.totalOrders },
                    { label: "Pendientes", value: stats.pendingOrders },
                    {
                      label: "Ingresos",
                      value: `$${parseFloat(String(stats.totalRevenue)).toFixed(2)}`,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="border border-gray-200 p-6 flex flex-col gap-2"
                    >
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                        {stat.label}
                      </span>
                      <span className="text-3xl font-medium text-black">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Usuarios", value: stats.totalUsers },
                    { label: "Productos", value: stats.totalProducts },
                    { label: "Categorías", value: stats.totalCategories },
                    {
                      label: "Stock bajo",
                      value: stats.lowStockProducts.length,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="border border-gray-200 p-6 flex flex-col gap-2"
                    >
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                        {stat.label}
                      </span>
                      <span className="text-3xl font-medium text-black">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                {stats.lowStockProducts.length > 0 && (
                  <div className="mt-8 flex flex-col gap-3">
                    <h4 className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">
                      Productos con stock bajo
                    </h4>
                    {stats.lowStockProducts.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between border border-gray-200 px-4 py-3"
                      >
                        <span className="text-[13px] text-black">{p.name}</span>
                        <span className="text-[12px] text-red-500 font-medium">
                          {p.stock} uds.
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-12 border-t border-gray-100 pt-8">
                  <h4 className="text-[13px] font-medium text-black uppercase tracking-wider mb-6">
                    Accesos rápidos
                  </h4>
                  <div className="flex flex-col gap-3 max-w-xs">
                    {(
                      ["users", "products", "categories", "orders"] as Tab[]
                    ).map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className="py-3 border border-gray-200 text-[11px] uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white transition-colors"
                      >
                        {t === "users"
                          ? "Gestionar Usuarios"
                          : t === "products"
                            ? "Gestionar Productos"
                            : t === "categories"
                              ? "Gestionar Categorías"
                              : "Gestionar Órdenes"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Users ──────────────────────────────────────────────────── */}
            {activeTab === "users" && (
              <div className="w-full flex flex-col">
                <h3 className="text-2xl font-medium text-black mb-12">
                  Usuarios
                </h3>
                <div className="flex flex-col gap-2">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between border border-gray-200 p-4"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[14px] font-medium text-black">
                          {u.name}
                        </span>
                        <span className="text-[12px] text-gray-500">
                          {u.email}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-widest mt-1 ${u.role === "admin" ? "text-black font-medium" : "text-gray-400"}`}
                        >
                          {u.role}
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={() => openEditUser(u)}
                          className="text-[12px] text-black underline underline-offset-2 hover:text-gray-600 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="text-[12px] text-red-500 underline underline-offset-2 hover:text-red-700 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Products ───────────────────────────────────────────────── */}
            {activeTab === "products" && (
              <div className="w-full flex flex-col">
                <div className="flex justify-between items-center mb-12">
                  <h3 className="text-2xl font-medium text-black">Productos</h3>
                  <button
                    onClick={() => {
                      setEditProductForm({
                        name: "",
                        description: "",
                        price: "",
                        stock: "",
                        category_id: "",
                        image_url: "",
                      });
                      setShowNewProduct(true);
                    }}
                    className="text-[12px] font-medium text-black underline underline-offset-4 uppercase tracking-wider hover:text-gray-600 transition-colors"
                  >
                    Añadir +
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between border border-gray-200 p-4 gap-4"
                    >
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="text-[14px] font-medium text-black truncate">
                          {p.name}
                        </span>
                        <span className="text-[12px] text-gray-500">
                          ${parseFloat(p.price).toFixed(2)} · Stock: {p.stock}
                        </span>
                      </div>
                      <div className="flex gap-4 flex-shrink-0">
                        <button
                          onClick={() => openEditProduct(p)}
                          className="text-[12px] text-black underline underline-offset-2 hover:text-gray-600 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-[12px] text-red-500 underline underline-offset-2 hover:text-red-700 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Categories ─────────────────────────────────────────────── */}
            {activeTab === "categories" && (
              <div className="w-full flex flex-col">
                <div className="flex justify-between items-center mb-12">
                  <h3 className="text-2xl font-medium text-black">
                    Categorías
                  </h3>
                  <button
                    onClick={() => {
                      setEditCategoryForm({
                        name: "",
                        slug: "",
                        gender: "",
                        image_url: "",
                      });
                      setShowNewCategory(true);
                    }}
                    className="text-[12px] font-medium text-black underline underline-offset-4 uppercase tracking-wider hover:text-gray-600 transition-colors"
                  >
                    Añadir +
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between border border-gray-200 p-4 gap-4"
                    >
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="text-[14px] font-medium text-black">
                          {c.name}
                        </span>
                        <span className="text-[12px] text-gray-500">
                          {c.slug} · {c.gender}
                        </span>
                      </div>
                      <div className="flex gap-4 flex-shrink-0">
                        <button
                          onClick={() => openEditCategory(c)}
                          className="text-[12px] text-black underline underline-offset-2 hover:text-gray-600 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="text-[12px] text-red-500 underline underline-offset-2 hover:text-red-700 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* ── Orders ────────────────────────────────────────────────── */}
            {activeTab === "orders" && (
              <div className="w-full flex flex-col">
                <div className="flex justify-between items-center mb-12">
                  <h3 className="text-2xl font-medium text-black">Órdenes</h3>
                  <select
                    value={ordersFilter}
                    onChange={(e) => setOrdersFilter(e.target.value)}
                    className="text-[12px] text-black border border-gray-200 px-3 py-2 outline-none focus:border-black bg-white"
                  >
                    <option value="">Todos los estados</option>
                    {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  {orders
                    .filter((o) => !ordersFilter || o.status === ordersFilter)
                    .map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between border border-gray-200 p-4 gap-4"
                      >
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="text-[14px] font-medium text-black">
                              #{o.id}
                            </span>
                            <span
                              className={`text-[10px] uppercase tracking-widest border px-2 py-0.5 ${ORDER_STATUS_STYLES[o.status] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}
                            >
                              {ORDER_STATUS_LABELS[o.status] ?? o.status}
                            </span>
                          </div>
                          <span className="text-[12px] text-gray-500 truncate">
                            {o.user_name} · {o.user_email}
                          </span>
                          <span className="text-[12px] text-gray-400">
                            {new Date(o.created_at).toLocaleDateString(
                              "es-ES",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <span className="text-[14px] font-medium text-black">
                            ${parseFloat(o.total_price).toFixed(2)}
                          </span>
                          <button
                            onClick={() => openOrderDetail(o.id)}
                            className="text-[12px] text-black underline underline-offset-2 hover:text-gray-600 transition-colors"
                          >
                            Gestionar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── User Edit Modal ────────────────────────────────────────────────── */}
      {editUser && (
        <Modal title="Editar usuario" onClose={() => setEditUser(null)}>
          <div className="flex flex-col gap-5">
            <Field label="Nombre">
              <input
                type="text"
                value={editUserForm.name}
                onChange={(e) =>
                  setEditUserForm({ ...editUserForm, name: e.target.value })
                }
                className="w-full text-[14px] text-black border-b border-gray-200 focus:border-black outline-none py-2 bg-white"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={editUserForm.email}
                onChange={(e) =>
                  setEditUserForm({ ...editUserForm, email: e.target.value })
                }
                className="w-full text-[14px] text-black border-b border-gray-200 focus:border-black outline-none py-2 bg-white"
              />
            </Field>
            <Field label="Rol">
              <select
                value={editUserForm.role}
                onChange={(e) =>
                  setEditUserForm({ ...editUserForm, role: e.target.value })
                }
                className="w-full text-[14px] text-black border-b border-gray-200 focus:border-black outline-none py-2 bg-white"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </Field>
          </div>
          <ModalActions
            loading={actionLoading}
            onCancel={() => setEditUser(null)}
            onSave={handleSaveUser}
          />
        </Modal>
      )}

      {/* ── Product Edit Modal ─────────────────────────────────────────────── */}
      {(editProduct || showNewProduct) && (
        <Modal
          title={showNewProduct ? "Nuevo producto" : "Editar producto"}
          onClose={() => {
            setEditProduct(null);
            setShowNewProduct(false);
          }}
        >
          <form
            onSubmit={
              showNewProduct
                ? handleCreateProduct
                : (e) => {
                    e.preventDefault();
                    handleSaveProduct();
                  }
            }
            className="flex flex-col gap-5"
          >
            {[
              { key: "name", label: "Nombre", type: "text" },
              { key: "description", label: "Descripción", type: "text" },
              { key: "price", label: "Precio", type: "number" },
              { key: "stock", label: "Stock", type: "number" },
              { key: "category_id", label: "Categoría ID", type: "number" },
              { key: "image_url", label: "URL de imagen", type: "text" },
            ].map(({ key, label, type }) => (
              <Field key={key} label={label}>
                <input
                  type={type}
                  required
                  value={editProductForm[key as keyof typeof editProductForm]}
                  onChange={(e) =>
                    setEditProductForm({
                      ...editProductForm,
                      [key]: e.target.value,
                    })
                  }
                  className="w-full text-[14px] text-black border-b border-gray-200 focus:border-black outline-none py-2 bg-white"
                />
              </Field>
            ))}
            <ModalActions
              loading={actionLoading}
              onCancel={() => {
                setEditProduct(null);
                setShowNewProduct(false);
              }}
            />
          </form>
        </Modal>
      )}

      {/* ── Category Edit Modal ────────────────────────────────────────────── */}
      {(editCategory || showNewCategory) && (
        <Modal
          title={showNewCategory ? "Nueva categoría" : "Editar categoría"}
          onClose={() => {
            setEditCategory(null);
            setShowNewCategory(false);
          }}
        >
          <form
            onSubmit={
              showNewCategory
                ? handleCreateCategory
                : (e) => {
                    e.preventDefault();
                    handleSaveCategory();
                  }
            }
            className="flex flex-col gap-5"
          >
            {[
              { key: "name", label: "Nombre" },
              { key: "slug", label: "Slug" },
              { key: "gender", label: "Género (men/women)" },
              { key: "image_url", label: "URL de imagen" },
            ].map(({ key, label }) => (
              <Field key={key} label={label}>
                <input
                  type="text"
                  required={key !== "image_url"}
                  value={editCategoryForm[key as keyof typeof editCategoryForm]}
                  onChange={(e) =>
                    setEditCategoryForm({
                      ...editCategoryForm,
                      [key]: e.target.value,
                    })
                  }
                  className="w-full text-[14px] text-black border-b border-gray-200 focus:border-black outline-none py-2 bg-white"
                />
              </Field>
            ))}
            <ModalActions
              loading={actionLoading}
              onCancel={() => {
                setEditCategory(null);
                setShowNewCategory(false);
              }}
            />
          </form>
        </Modal>
      )}

      {/* ── Order Detail Modal ─────────────────────────────────────────────── */}
      {orderDetail && (
        <Modal
          title={`Orden #${orderDetail.id}`}
          onClose={() => setOrderDetail(null)}
        >
          <div className="flex flex-col gap-4 text-[13px]">
            <p className="text-gray-500">
              {orderDetail.user_name} · {orderDetail.user_email}
            </p>
            <p className="text-gray-500">
              {orderDetail.street}, {orderDetail.city}, {orderDetail.country}
            </p>
            <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
              {orderDetail.items.map((item) => (
                <div key={item.product_id} className="flex justify-between">
                  <span className="text-black">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="text-gray-500">
                    ${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-3 font-medium">
              <span>Total</span>
              <span>${parseFloat(orderDetail.total_price).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-4 border-t border-gray-100 pt-4">
            <Field label="Estado del pedido">
              <select
                value={orderStatusForm.status}
                onChange={(e) =>
                  setOrderStatusForm({
                    ...orderStatusForm,
                    status: e.target.value,
                  })
                }
                className="w-full text-[14px] text-black border-b border-gray-200 focus:border-black outline-none py-2 bg-white"
              >
                {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estado de pago">
              <select
                value={orderStatusForm.payment_status}
                onChange={(e) =>
                  setOrderStatusForm({
                    ...orderStatusForm,
                    payment_status: e.target.value,
                  })
                }
                className="w-full text-[14px] text-black border-b border-gray-200 focus:border-black outline-none py-2 bg-white"
              >
                {["pending", "paid", "failed", "refunded"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <ModalActions
            loading={actionLoading}
            onCancel={() => setOrderDetail(null)}
            onSave={handleUpdateOrderStatus}
          />
        </Modal>
      )}
    </div>
  );
}

// ─── Small reusable sub-components ────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-[90%] max-w-sm p-8 flex flex-col gap-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h4 className="text-[15px] font-medium text-black tracking-tight">
          {title}
        </h4>
        {children}
        <button
          onClick={onClose}
          className="text-[12px] text-gray-400 hover:text-black transition-colors text-center"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-gray-400 uppercase tracking-widest">
        {label}
      </label>
      {children}
    </div>
  );
}

function ModalActions({
  loading,
  onCancel,
  onSave,
}: {
  loading: boolean;
  onCancel: () => void;
  onSave?: () => void;
}) {
  return (
    <div className="flex gap-3 mt-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 py-3 text-[11px] text-black border border-gray-200 uppercase tracking-[0.2em] hover:border-black transition-colors"
      >
        Cancelar
      </button>
      <button
        type={onSave ? "button" : "submit"}
        onClick={onSave}
        disabled={loading}
        className="flex-1 py-3 bg-black text-white text-[11px] uppercase tracking-[0.2em] hover:bg-gray-900 transition-colors disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}
