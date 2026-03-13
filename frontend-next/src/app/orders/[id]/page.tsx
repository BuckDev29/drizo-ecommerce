"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useApiRequest from "@/hooks/useApiRequest";
import Loading from "@/components/Loading";

interface OrderDetail {
  id: number;
  status: string;
  payment_method: string;
  payment_status: string;
  total_price: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  items: {
    product_id: number;
    name: string;
    quantity: number;
    unit_price: string;
    image_url: string;
  }[];
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

const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: "Pago contra entrega",
  card: "Tarjeta de crédito/débito",
  paypal: "PayPal",
};

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { apiRequest, loading } = useApiRequest();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
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
          `orders/${id}`,
          true,
          "GET",
          null,
          false,
          false,
          token,
        );
        setOrder(data);
      } catch (err: any) {
        setError(err.message || "Error al cargar la orden");
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id, router]);

  const handleCancel = async () => {
    if (!confirm("¿Cancelar este pedido?")) return;
    setCancelling(true);
    try {
      await apiRequest(
        `orders/${id}/cancel`,
        true,
        "PUT",
        null,
        false,
        false,
        getToken(),
      );
      setOrder((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
    } catch (err: any) {
      setError(err.message || "No se pudo cancelar el pedido");
    } finally {
      setCancelling(false);
    }
  };

  if (pageLoading) return <Loading fullScreen />;

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pt-20">
        <p className="text-red-500">{error || "Orden no encontrada"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-40 pb-20 px-6 md:px-12 lg:px-20">
      <div className="max-w-2xl mx-auto flex flex-col gap-12">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <Link
              href="/orders"
              className="text-[12px] text-gray-400 hover:text-black transition-colors"
            >
              ← Mis pedidos
            </Link>
            <h1 className="text-3xl font-medium text-black tracking-tight">
              Pedido #{order.id}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`text-[10px] uppercase tracking-widest border px-2 py-1 ${STATUS_STYLES[order.status] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}
              >
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
              <span className="text-[12px] text-gray-400">
                {new Date(order.created_at).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {order.status === "pending" && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-[11px] uppercase tracking-[0.15em] text-red-500 border border-red-200 px-4 py-2 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
            >
              {cancelling ? "Cancelando..." : "Cancelar"}
            </button>
          )}
        </div>

        {/* Items */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[11px] text-gray-400 uppercase tracking-widest">
            Artículos
          </h2>
          <div className="flex flex-col gap-3">
            {order.items.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center gap-4 border border-gray-100 p-3"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-14 h-14 object-cover bg-gray-50 flex-shrink-0"
                  />
                )}
                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                  <span className="text-[13px] font-medium text-black truncate">
                    {item.name}
                  </span>
                  <span className="text-[12px] text-gray-500">
                    x{item.quantity} · ${parseFloat(item.unit_price).toFixed(2)}{" "}
                    c/u
                  </span>
                </div>
                <span className="text-[13px] text-black flex-shrink-0">
                  ${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Info */}
        <section className="flex flex-col gap-4 border-t border-gray-100 pt-8">
          <h2 className="text-[11px] text-gray-400 uppercase tracking-widest">
            Información del pedido
          </h2>
          <div className="flex flex-col gap-3">
            <Row
              label="Dirección"
              value={`${order.street}, ${order.city}, ${order.state} ${order.zip_code}, ${order.country}`}
            />
            <Row
              label="Método de pago"
              value={
                PAYMENT_LABELS[order.payment_method] ?? order.payment_method
              }
            />
            <Row label="Estado de pago" value={order.payment_status} />
            {order.notes && <Row label="Notas" value={order.notes} />}
          </div>
        </section>

        {/* Total */}
        <div className="flex justify-between items-center border-t border-gray-200 pt-6">
          <span className="text-[13px] text-gray-500">Total</span>
          <span className="text-2xl font-medium text-black">
            ${parseFloat(order.total_price).toFixed(2)}
          </span>
        </div>

        {error && <p className="text-[12px] text-red-500">{error}</p>}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="text-[12px] text-gray-400 w-32 flex-shrink-0">
        {label}
      </span>
      <span className="text-[13px] text-black capitalize">{value}</span>
    </div>
  );
}
