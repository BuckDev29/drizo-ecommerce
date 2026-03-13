"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useApiRequest from "@/hooks/useApiRequest";
import Loading from "@/components/Loading";
import Link from "next/link";

interface OrderConfirm {
  id: number;
  status: string;
  payment_method: string;
  payment_status: string;
  total_price: string;
  notes?: string;
  created_at: string;
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

const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: "Pago contra entrega",
  card: "Tarjeta de crédito/débito",
  paypal: "PayPal",
};

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

export default function OrderConfirmPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { apiRequest } = useApiRequest();
  const [order, setOrder] = useState<OrderConfirm | null>(null);
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
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  if (loading) return <Loading fullScreen />;

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pt-20">
        <p className="text-red-500">{error || "Orden no encontrada"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-40 pb-20 px-6 md:px-12 lg:px-20">
      <div className="max-w-lg mx-auto flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="w-10 h-10 border-2 border-black flex items-center justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-3xl font-medium text-black tracking-tight">
            ¡Pedido confirmado!
          </h1>
          <p className="text-[14px] text-gray-500">
            Tu pedido{" "}
            <span className="text-black font-medium">#{order.id}</span> fue
            recibido correctamente.
          </p>
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
                    x{item.quantity}
                  </span>
                </div>
                <span className="text-[13px] text-black flex-shrink-0">
                  ${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Details */}
        <section className="flex flex-col gap-4 border-t border-gray-100 pt-8">
          <h2 className="text-[11px] text-gray-400 uppercase tracking-widest">
            Detalles
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
            <Row label="Estado" value={order.status} />
            <Row
              label="Fecha"
              value={new Date(order.created_at).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
            {order.notes && <Row label="Notas" value={order.notes} />}
          </div>
        </section>

        {/* Total */}
        <div className="flex justify-between items-center border-t border-gray-200 pt-6">
          <span className="text-[13px] text-gray-500">Total pagado</span>
          <span className="text-2xl font-medium text-black">
            ${parseFloat(order.total_price).toFixed(2)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href="/orders"
            className="w-full py-3.5 bg-black text-white text-[11px] uppercase tracking-[0.2em] hover:bg-gray-900 transition-colors text-center"
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/"
            className="w-full py-3.5 border border-gray-200 text-black text-[11px] uppercase tracking-[0.2em] hover:border-black transition-colors text-center"
          >
            Seguir comprando
          </Link>
        </div>
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
