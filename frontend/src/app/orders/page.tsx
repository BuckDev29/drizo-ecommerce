"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useApiRequest from "@/hooks/useApiRequest";
import Loading from "@/components/Loading";

interface Order {
  id: number;
  status: string;
  payment_method: string;
  payment_status: string;
  total_price: string;
  created_at: string;
  street: string;
  city: string;
  country: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-500 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  processing: "En proceso",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

export default function OrdersPage() {
  const router = useRouter();
  const { apiRequest } = useApiRequest();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/auth");
      return;
    }
    const load = async () => {
      try {
        const data = await apiRequest(
          "orders",
          true,
          "GET",
          null,
          false,
          false,
          token,
        );
        setOrders(data);
      } catch (err: any) {
        setError(err.message || "Error al cargar los pedidos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  if (loading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen bg-white pt-40 pb-20 px-6 md:px-12 lg:px-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-16">
          <h1 className="text-3xl font-medium text-black tracking-tight">
            Mis pedidos
          </h1>
          <Link
            href="/profile"
            className="text-[12px] text-gray-400 hover:text-black transition-colors"
          >
            ← Perfil
          </Link>
        </div>

        {error && <p className="text-red-500 text-[13px] mb-8">{error}</p>}

        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-6 py-20">
            <p className="text-[15px] text-black">Aún no tienes pedidos.</p>
            <Link
              href="/"
              className="px-8 py-3 bg-black text-white text-[11px] uppercase tracking-[0.2em] hover:bg-gray-900 transition-colors"
            >
              Ir a comprar
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between border border-gray-200 p-5 hover:border-black transition-colors group"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-medium text-black">
                      Pedido #{order.id}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-widest border px-2 py-0.5 ${STATUS_STYLES[order.status] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>
                  <span className="text-[12px] text-gray-500">
                    {order.city}, {order.country}
                  </span>
                  <span className="text-[12px] text-gray-400">
                    {new Date(order.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-[16px] font-medium text-black">
                    ${parseFloat(order.total_price).toFixed(2)}
                  </span>
                  <span className="text-[11px] text-gray-400 group-hover:text-black transition-colors">
                    Ver detalle →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
