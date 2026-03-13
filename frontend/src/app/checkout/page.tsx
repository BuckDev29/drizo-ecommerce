"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useApiRequest from "@/hooks/useApiRequest";
import Loading from "@/components/Loading";
import { useCart } from "@/context/CartContext";

interface Address {
  id: number;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

interface UserInfo {
  name: string;
  email: string;
  role: string;
  created_at: string;
}

type NewAddressForm = {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
};

const PAYMENT_METHODS = [
  {
    value: "card",
    label: "Tarjeta de credito / debito",
    detail: "Pago seguro con tarjeta",
  },
  { value: "paypal", label: "PayPal", detail: "Paga con tu cuenta PayPal" },
];

const STEPS = ["Informacion", "Direccion", "Pago"];

const EMPTY_ADDRESS: NewAddressForm = {
  street: "",
  city: "",
  state: "",
  zip_code: "",
  country: "",
};

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

export default function CheckoutPage() {
  const router = useRouter();
  const { apiRequest, loading } = useApiRequest();
  const { items, total, refreshCart } = useCart();

  const [step, setStep] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isStepTransitioning, setIsStepTransitioning] = useState(false);
  const [error, setError] = useState("");

  const [user, setUser] = useState<UserInfo | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<NewAddressForm>(EMPTY_ADDRESS);
  const [addressLoading, setAddressLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("card");

  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/auth");
      return;
    }

    const load = async () => {
      try {
        const [userData, addressData] = await Promise.all([
          apiRequest("user/profile", true, "GET", null, false, false, token),
          apiRequest("addresses", true, "GET", null, false, false, token),
        ]);

        setUser(userData);
        setNameInput(userData.name);
        setAddresses(addressData);
        if (addressData.length > 0) {
          setSelectedAddress(addressData[0].id);
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar datos");
      } finally {
        setInitialLoading(false);
      }
    };

    load();

    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, [apiRequest, router]);

  const selectedAddr = addresses.find(
    (address) => address.id === selectedAddress,
  );
  const hasNameChanges = user ? nameInput.trim() !== user.name : false;

  const goToStep = (nextStep: number) => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }

    setError("");
    setIsStepTransitioning(true);
    transitionTimerRef.current = window.setTimeout(() => {
      setStep(nextStep);
      setIsStepTransitioning(false);
      transitionTimerRef.current = null;
    }, 240);
  };

  const reloadAddresses = async (preferredId?: number) => {
    const data = await apiRequest(
      "addresses",
      true,
      "GET",
      null,
      false,
      false,
      getToken(),
    );

    setAddresses(data);

    if (data.length === 0) {
      setSelectedAddress(null);
      return;
    }

    if (
      preferredId &&
      data.some((address: Address) => address.id === preferredId)
    ) {
      setSelectedAddress(preferredId);
      return;
    }

    if (
      selectedAddress &&
      data.some((address: Address) => address.id === selectedAddress)
    ) {
      return;
    }

    setSelectedAddress(data[0].id);
  };

  const handleInfoContinue = async () => {
    if (!user) return;
    if (!nameInput.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    if (hasNameChanges) {
      setSavingInfo(true);
      try {
        await apiRequest(
          "user/profile",
          true,
          "PUT",
          { name: nameInput.trim() },
          false,
          false,
          getToken(),
        );
        setUser({ ...user, name: nameInput.trim() });
      } catch (err: any) {
        setError(err.message || "Error al guardar tu informacion");
        setSavingInfo(false);
        return;
      } finally {
        setSavingInfo(false);
      }
    }

    goToStep(1);
  };

  const handleAddAddress = async () => {
    if (Object.values(newAddress).some((value) => !value.trim())) {
      setError("Completa todos los campos de la nueva direccion");
      return;
    }

    setAddressLoading(true);
    try {
      const response = await apiRequest(
        "addresses",
        true,
        "POST",
        newAddress,
        false,
        false,
        getToken(),
      );
      await reloadAddresses(response.id);
      setShowNewAddressForm(false);
      setNewAddress(EMPTY_ADDRESS);
      setError("");
    } catch (err: any) {
      setError(err.message || "Error al agregar la direccion");
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    setAddressLoading(true);
    try {
      await apiRequest(
        `addresses/${addressId}`,
        true,
        "DELETE",
        null,
        false,
        false,
        getToken(),
      );
      await reloadAddresses();
      setError("");
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar la direccion");
    } finally {
      setAddressLoading(false);
    }
  };

  const handleAddressContinue = () => {
    if (!selectedAddress) {
      setError("Selecciona una direccion de envio");
      return;
    }
    goToStep(2);
  };

  const handleConfirm = async () => {
    setError("");
    if (!selectedAddress) {
      setError("Selecciona una direccion de envio");
      return;
    }
    if (items.length === 0) {
      setError("Tu carrito esta vacio");
      return;
    }

    try {
      const result = await apiRequest(
        "orders",
        true,
        "POST",
        {
          address_id: selectedAddress,
          payment_method: paymentMethod,
          notes: notes || undefined,
        },
        false,
        false,
        getToken(),
      );
      await refreshCart();
      router.push(`/order-confirm/${result.order_id}`);
    } catch (err: any) {
      setError(err.message || "Error al procesar el pedido");
    }
  };

  if (initialLoading) return <Loading fullScreen />;

  return (
    <div className="min-h-screen bg-white pt-40 pb-20 px-6 md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 flex flex-col gap-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-gray-400">
            Checkout
          </p>
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-medium tracking-tight text-black md:text-4xl">
                Finaliza tu pedido.
              </h1>
            </div>
            <p className="max-w-xs text-[13px] leading-6 text-gray-500">
              Informacion, envio y pago.
            </p>
          </div>
        </div>

        <div className="mb-16 grid gap-4 md:grid-cols-3">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              disabled={index > step || isStepTransitioning}
              onClick={() => {
                if (index <= step) {
                  goToStep(index);
                }
              }}
              className={`flex items-start gap-4 border px-5 py-5 text-left transition-colors ${
                index === step
                  ? "border-black bg-black text-white"
                  : index < step
                    ? "border-gray-300 bg-white text-black"
                    : "border-gray-200 bg-white text-gray-300"
              } ${index > step ? "cursor-default" : "hover:border-black"}`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center border text-[11px] font-medium ${
                  index === step
                    ? "border-white text-white"
                    : index < step
                      ? "border-black text-black"
                      : "border-gray-200 text-gray-300"
                }`}
              >
                {index + 1}
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-[0.2em] opacity-70">
                  Paso {index + 1}
                </span>
                <span className="text-[14px] font-medium">{label}</span>
              </span>
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-6 py-20">
            <p className="text-[15px] text-black">Tu carrito esta vacio.</p>
            <button
              onClick={() => router.push("/")}
              className="bg-black px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-gray-900"
            >
              Ir a comprar
            </button>
          </div>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-16 xl:gap-24">
            <div className="min-w-0 border border-gray-200 bg-white">
              <div className="border-b border-gray-200 bg-[linear-gradient(180deg,#fafaf8_0%,#ffffff_100%)] px-7 py-7 md:px-9 md:py-8">
                <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400">
                  Paso actual
                </p>
                <h2 className="mt-4 text-2xl font-medium tracking-tight text-black">
                  {step === 0 && "Informacion personal"}
                  {step === 1 && "Direccion de envio"}
                  {step === 2 && "Metodo de pago"}
                </h2>
              </div>

              <div className="px-7 py-10 md:px-9 md:py-11">
                {isStepTransitioning ? (
                  <StepSkeleton />
                ) : (
                  <>
                    {step === 0 && user && (
                      <section className="flex flex-col gap-10">
                        <div className="grid gap-8 md:grid-cols-2">
                          <Field label="Nombre completo">
                            <input
                              type="text"
                              value={nameInput}
                              onChange={(e) => setNameInput(e.target.value)}
                              className="w-full border-b border-gray-200 bg-transparent py-3 text-[15px] text-black outline-none transition-colors focus:border-black"
                            />
                          </Field>
                          <Field label="Email">
                            <input
                              type="email"
                              value={user.email}
                              readOnly
                              className="w-full border-b border-gray-100 bg-transparent py-3 text-[15px] text-gray-400 outline-none"
                            />
                          </Field>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2">
                          <Field label="Cliente desde">
                            <input
                              type="text"
                              value={new Date(
                                user.created_at,
                              ).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                              readOnly
                              className="w-full border-b border-gray-100 bg-transparent py-3 text-[15px] text-gray-400 outline-none"
                            />
                          </Field>
                          <div className="flex items-end border-b border-gray-100 pb-3">
                            <p className="text-[13px] leading-6 text-gray-500">
                              Datos de tu cuenta.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4">
                          <button
                            type="button"
                            onClick={handleInfoContinue}
                            disabled={savingInfo}
                            className="bg-black px-10 py-3.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-gray-900 disabled:opacity-50"
                          >
                            {savingInfo
                              ? "Guardando..."
                              : hasNameChanges
                                ? "Guardar y continuar"
                                : "Continuar"}
                          </button>
                        </div>
                      </section>
                    )}

                    {step === 1 && (
                      <section className="flex flex-col gap-10">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <p className="max-w-md text-[14px] leading-6 text-gray-500">
                            Elige una direccion o agrega otra.
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setShowNewAddressForm((current) => !current)
                            }
                            className="self-start border border-gray-200 px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] text-black transition-colors hover:border-black"
                          >
                            {showNewAddressForm
                              ? "Cerrar formulario"
                              : "Nueva direccion"}
                          </button>
                        </div>

                        {showNewAddressForm && (
                          <div className="grid gap-7 border border-gray-200 bg-stone-50/70 p-6 md:grid-cols-2">
                            <Field label="Calle o avenida">
                              <input
                                type="text"
                                value={newAddress.street}
                                onChange={(e) =>
                                  setNewAddress({
                                    ...newAddress,
                                    street: e.target.value,
                                  })
                                }
                                className="w-full border-b border-gray-200 bg-transparent py-3 text-[14px] text-black outline-none transition-colors focus:border-black"
                              />
                            </Field>
                            <Field label="Ciudad">
                              <input
                                type="text"
                                value={newAddress.city}
                                onChange={(e) =>
                                  setNewAddress({
                                    ...newAddress,
                                    city: e.target.value,
                                  })
                                }
                                className="w-full border-b border-gray-200 bg-transparent py-3 text-[14px] text-black outline-none transition-colors focus:border-black"
                              />
                            </Field>
                            <Field label="Estado / provincia">
                              <input
                                type="text"
                                value={newAddress.state}
                                onChange={(e) =>
                                  setNewAddress({
                                    ...newAddress,
                                    state: e.target.value,
                                  })
                                }
                                className="w-full border-b border-gray-200 bg-transparent py-3 text-[14px] text-black outline-none transition-colors focus:border-black"
                              />
                            </Field>
                            <Field label="Codigo postal">
                              <input
                                type="text"
                                value={newAddress.zip_code}
                                onChange={(e) =>
                                  setNewAddress({
                                    ...newAddress,
                                    zip_code: e.target.value,
                                  })
                                }
                                className="w-full border-b border-gray-200 bg-transparent py-3 text-[14px] text-black outline-none transition-colors focus:border-black"
                              />
                            </Field>
                            <Field label="Pais">
                              <input
                                type="text"
                                value={newAddress.country}
                                onChange={(e) =>
                                  setNewAddress({
                                    ...newAddress,
                                    country: e.target.value,
                                  })
                                }
                                className="w-full border-b border-gray-200 bg-transparent py-3 text-[14px] text-black outline-none transition-colors focus:border-black"
                              />
                            </Field>
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={handleAddAddress}
                                disabled={addressLoading}
                                className="w-full bg-black px-6 py-3 text-[11px] uppercase tracking-[0.18em] text-white transition-colors hover:bg-gray-900 disabled:opacity-50"
                              >
                                {addressLoading
                                  ? "Guardando..."
                                  : "Guardar direccion"}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col gap-4">
                          {addresses.length === 0 ? (
                            <div className="border border-dashed border-gray-200 px-5 py-12 text-center text-[14px] text-gray-500">
                              Aun no tienes direcciones guardadas.
                            </div>
                          ) : (
                            addresses.map((address) => (
                              <label
                                key={address.id}
                                className={`group flex gap-4 border px-5 py-6 transition-colors ${
                                  selectedAddress === address.id
                                    ? "border-black bg-stone-50/50"
                                    : "border-gray-200 hover:border-gray-400"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="selectedAddress"
                                  checked={selectedAddress === address.id}
                                  onChange={() =>
                                    setSelectedAddress(address.id)
                                  }
                                  className="mt-1 accent-black"
                                />
                                <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-[14px] font-medium text-black">
                                      {address.street}
                                    </span>
                                    <span className="text-[13px] text-gray-500">
                                      {address.city}, {address.state}{" "}
                                      {address.zip_code}
                                    </span>
                                    <span className="text-[13px] text-gray-500">
                                      {address.country}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.preventDefault();
                                      handleDeleteAddress(address.id);
                                    }}
                                    disabled={addressLoading}
                                    className="self-start text-[11px] uppercase tracking-[0.16em] text-gray-400 transition-colors hover:text-red-500 disabled:opacity-50"
                                  >
                                    Quitar
                                  </button>
                                </div>
                              </label>
                            ))
                          )}
                        </div>

                        <Field label="Notas">
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            placeholder="Indicaciones para la entrega"
                            className="w-full border border-gray-200 bg-stone-50/30 p-4 text-[14px] text-black outline-none transition-colors focus:border-black"
                          />
                        </Field>

                        <div className="flex flex-wrap gap-4 pt-4">
                          <button
                            type="button"
                            onClick={() => goToStep(0)}
                            className="border border-gray-200 px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] text-black transition-colors hover:border-black"
                          >
                            Atras
                          </button>
                          <button
                            type="button"
                            onClick={handleAddressContinue}
                            disabled={!selectedAddress}
                            className="bg-black px-10 py-3.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-gray-900 disabled:opacity-50"
                          >
                            Continuar
                          </button>
                        </div>
                      </section>
                    )}

                    {step === 2 && (
                      <section className="flex flex-col gap-10">
                        <div className="grid gap-4">
                          {PAYMENT_METHODS.map((method) => (
                            <label
                              key={method.value}
                              className={`flex cursor-pointer items-start gap-4 border px-5 py-5 transition-colors ${
                                paymentMethod === method.value
                                  ? "border-black bg-stone-50/50"
                                  : "border-gray-200 hover:border-gray-400"
                              }`}
                            >
                              <input
                                type="radio"
                                name="paymentMethod"
                                checked={paymentMethod === method.value}
                                onChange={() => setPaymentMethod(method.value)}
                                className="mt-1 accent-black"
                              />
                              <span className="flex flex-col gap-1">
                                <span className="text-[14px] font-medium text-black">
                                  {method.label}
                                </span>
                                <span className="text-[12px] text-gray-500">
                                  {method.detail}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>

                        <div className="border border-gray-200 bg-[linear-gradient(180deg,#fafaf8_0%,#ffffff_100%)] p-6">
                          <p className="mb-4 text-[10px] uppercase tracking-[0.24em] text-gray-400">
                            Resumen final
                          </p>
                          <div className="grid gap-6 md:grid-cols-2">
                            <InfoRow label="Nombre" value={user?.name || ""} />
                            <InfoRow label="Email" value={user?.email || ""} />
                            <InfoRow
                              label="Direccion"
                              value={
                                selectedAddr
                                  ? `${selectedAddr.street}, ${selectedAddr.city}`
                                  : "Sin direccion"
                              }
                            />
                            <InfoRow
                              label="Pago"
                              value={
                                PAYMENT_METHODS.find(
                                  (method) => method.value === paymentMethod,
                                )?.label || paymentMethod
                              }
                            />
                          </div>

                          <div className="mt-6 flex flex-wrap gap-5 border-t border-gray-200 pt-5">
                            <button
                              type="button"
                              onClick={() => goToStep(0)}
                              className="text-[11px] uppercase tracking-[0.16em] text-gray-400 transition-colors hover:text-black"
                            >
                              Editar informacion
                            </button>
                            <button
                              type="button"
                              onClick={() => goToStep(1)}
                              className="text-[11px] uppercase tracking-[0.16em] text-gray-400 transition-colors hover:text-black"
                            >
                              Editar direccion
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4">
                          <button
                            type="button"
                            onClick={() => goToStep(1)}
                            className="border border-gray-200 px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] text-black transition-colors hover:border-black"
                          >
                            Atras
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={loading}
                            className="bg-black px-10 py-3.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-gray-900 disabled:opacity-50"
                          >
                            {loading ? "Procesando..." : "Confirmar pedido"}
                          </button>
                        </div>
                      </section>
                    )}
                  </>
                )}

                {error && (
                  <p className="mt-6 text-[12px] text-red-500">{error}</p>
                )}
              </div>
            </div>

            <aside className="lg:sticky lg:top-40 lg:self-start lg:pl-4 xl:pl-8">
              <div className="border border-gray-200 bg-stone-50/40">
                <div className="border-b border-gray-200 bg-stone-100/50 px-6 py-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400">
                    Tu bolsa
                  </p>
                  <h3 className="mt-2 text-xl font-medium tracking-tight text-black">
                    Resumen del pedido
                  </h3>
                </div>

                <div className="flex flex-col gap-6 px-6 py-7">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-16 w-14 flex-shrink-0 bg-gray-100 object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-black">
                          {item.name}
                        </p>
                        <p className="mt-1 text-[12px] text-gray-500">
                          x{item.quantity}
                        </p>
                      </div>
                      <span className="text-[13px] text-black">
                        $
                        {(
                          parseFloat(item.price || "0") * item.quantity
                        ).toFixed(2)}
                      </span>
                    </div>
                  ))}

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between text-[13px] text-gray-500">
                      <span>Total</span>
                      <span className="text-[19px] font-medium text-black">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
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
    <div className="flex flex-col gap-3">
      <label className="text-[10px] uppercase tracking-[0.24em] text-gray-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-[0.22em] text-gray-400">
        {label}
      </span>
      <span className="text-[14px] text-black">{value}</span>
    </div>
  );
}

function StepSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-8">
      <div className="h-5 w-32 bg-gray-100" />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="h-16 bg-gray-100" />
        <div className="h-16 bg-gray-100" />
      </div>
      <div className="h-32 bg-gray-100" />
      <div className="flex gap-4">
        <div className="h-11 w-28 bg-gray-100" />
        <div className="h-11 w-40 bg-gray-100" />
      </div>
    </div>
  );
}
