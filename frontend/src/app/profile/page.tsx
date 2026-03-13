"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useApiRequest from "@/hooks/useApiRequest";
import Loading from "@/components/Loading";

export default function ProfilePage() {
  const router = useRouter();
  const { apiRequest, loading } = useApiRequest();
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
    created_at: string;
  } | null>(null);

  // Addresses State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip_code: "",
    country: "",
  });
  const [addingAddress, setAddingAddress] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("compras");

  // Gender preference
  const [genderPreference, setGenderPreference] = useState<
    "men" | "women" | ""
  >("");

  // Track saved/original values to detect unsaved changes
  const [savedName, setSavedName] = useState("");
  const [savedGender, setSavedGender] = useState<"men" | "women" | "">("");

  // Unsaved changes modal
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("genderPreference") as
      | "men"
      | "women"
      | ""
      | null;
    if (saved) {
      setGenderPreference(saved);
      setSavedGender(saved);
    }
  }, []);

  // Sync savedName once user loads
  useEffect(() => {
    if (user) setSavedName(user.name);
  }, [user?.email]); // only on initial load, keyed by email

  const hasUnsavedChanges = () => {
    if (!user) return false;
    return user.name !== savedName || genderPreference !== savedGender;
  };

  const handleGenderChange = (value: "men" | "women" | "") => {
    setGenderPreference(value);
  };

  // Guard: intercept tab switch / logout when there are unsaved changes
  const guardedAction = (action: () => void) => {
    if (activeTab === "datos" && hasUnsavedChanges()) {
      setPendingAction(() => action);
      setShowUnsavedModal(true);
    } else {
      action();
    }
  };

  const confirmDiscard = () => {
    // Revert to saved values
    if (user) setUser({ ...user, name: savedName });
    setGenderPreference(savedGender);
    setShowUnsavedModal(false);
    pendingAction?.();
    setPendingAction(null);
  };

  const confirmSaveAndLeave = async () => {
    await handleSaveProfile();
    setShowUnsavedModal(false);
    pendingAction?.();
    setPendingAction(null);
  };

  const shopHref = genderPreference
    ? `/categories?gender=${genderPreference}`
    : "/";

  // Save profile handler (reusable)
  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await apiRequest(
        "user/profile",
        true,
        "PUT",
        { name: user.name },
        false,
        false,
        localStorage.getItem("token") || "",
      );
      // Save gender preference to localStorage
      if (genderPreference) {
        localStorage.setItem("genderPreference", genderPreference);
      } else {
        localStorage.removeItem("genderPreference");
      }
      setSavedName(user.name);
      setSavedGender(genderPreference);
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/auth");
        return;
      }

      try {
        const userData = await apiRequest(
          "user/profile",
          true,
          "GET",
          null,
          false,
          false,
          token,
        );
        setUser(userData);

        try {
          const addressesData = await apiRequest(
            "addresses",
            true,
            "GET",
            null,
            false,
            false,
            token,
          );
          setAddresses(addressesData);
        } catch (addrErr) {
          console.error("Error fetching addresses:", addrErr);
          // Don't kill the profile load if addresses fail
        }
      } catch (err: any) {
        const msg = (err.message || "").toLowerCase();
        if (
          msg.includes("no tienes autorización") ||
          msg.includes("invalid token") ||
          msg.includes("unauthorized")
        ) {
          localStorage.removeItem("token");
          window.dispatchEvent(new Event("auth-change"));
          router.replace("/auth");
          return;
        }
        setError(err.message || "Error al cargar el perfil");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingAddress(true);
    try {
      const token = localStorage.getItem("token") || "";
      await apiRequest(
        "addresses",
        true,
        "POST",
        newAddress,
        false,
        false,
        token,
      );

      // refresh list
      const updated = await apiRequest(
        "addresses",
        true,
        "GET",
        null,
        false,
        false,
        token,
      );
      setAddresses(updated);

      setShowAddressForm(false);
      setNewAddress({
        street: "",
        city: "",
        state: "",
        zip_code: "",
        country: "",
      });
    } catch (err) {
      console.error("Failed to add address", err);
    } finally {
      setAddingAddress(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    window.dispatchEvent(new Event("auth-change"));
    router.push("/");
  };

  if (initialLoading || (!user && loading)) return <Loading fullScreen />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white pt-20">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-40 pb-20 px-6 md:px-12 lg:px-20">
      <div className="flex flex-col md:flex-row w-full h-full relative">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col md:absolute md:left-0 md:top-0">
          {user && (
            <div className="mb-12">
              <h2 className="text-3xl font-medium text-black tracking-tight mb-2">
                Hola
              </h2>
              <p className="text-[13px] text-gray-500 tracking-wide">
                {user.email}
              </p>
            </div>
          )}

          <nav className="flex flex-col gap-6">
            <button
              onClick={() => guardedAction(() => setActiveTab("compras"))}
              className={`text-left text-[14px] transition-colors ${
                activeTab === "compras"
                  ? "text-black font-medium"
                  : "text-gray-400 hover:text-black"
              }`}
            >
              Mis compras
            </button>
            <button
              onClick={() => guardedAction(() => router.push("/orders"))}
              className="text-left text-[14px] text-gray-400 hover:text-black transition-colors"
            >
              Mis pedidos
            </button>
            <button
              onClick={() => guardedAction(() => setActiveTab("datos"))}
              className={`text-left text-[14px] transition-colors ${
                activeTab === "datos"
                  ? "text-black font-medium"
                  : "text-gray-400 hover:text-black"
              }`}
            >
              Datos personales
            </button>
            <button
              onClick={() => guardedAction(() => setActiveTab("direcciones"))}
              className={`text-left text-[14px] transition-colors ${
                activeTab === "direcciones"
                  ? "text-black font-medium"
                  : "text-gray-400 hover:text-black"
              }`}
            >
              Direcciones guardadas
            </button>

            {user?.role === "admin" && (
              <>
                <div className="border-t border-gray-100 pt-6 mt-2">
                  <p className="text-[10px] text-gray-300 uppercase tracking-widest mb-4">
                    Administración
                  </p>
                  <button
                    onClick={() => guardedAction(() => router.push("/admin"))}
                    className="text-left text-[14px] text-gray-400 hover:text-black transition-colors"
                  >
                    Panel de administración
                  </button>
                </div>
              </>
            )}

            <button
              onClick={() => guardedAction(handleLogout)}
              className="text-left text-[14px] text-gray-400 hover:text-black transition-colors mt-8"
            >
              Cerrar sesión
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[400px] flex items-start justify-center pt-24 md:pt-0 w-full">
          <div className="w-full max-w-lg flex flex-col px-4 md:px-0">
            {activeTab === "compras" && (
              <div className="w-full flex flex-col">
                <h3 className="text-2xl font-medium text-black mb-16">
                  Mis compras
                </h3>
                <div className="flex flex-col items-center justify-center h-[100px] gap-6">
                  <p className="text-[15px] text-black text-center">
                    Aun no tienes compras online.
                  </p>
                  <Link
                    href={shopHref}
                    className="px-8 py-3 bg-black text-white text-[11px] uppercase tracking-[0.2em] hover:bg-gray-900 transition-colors"
                  >
                    Ir a comprar
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "datos" && user && (
              <div className="w-full flex flex-col">
                <h3 className="text-2xl font-medium text-black mb-12">
                  Datos personales
                </h3>

                <div className="flex flex-col gap-12 w-full text-left">
                  {/* Nombre y Miembro Desde Form/Info */}
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2 max-w-[400px]">
                      <label className="text-[11px] text-gray-400 uppercase tracking-widest">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        value={user.name}
                        onChange={(e) =>
                          setUser({ ...user, name: e.target.value })
                        }
                        className="w-full text-[15px] text-black border-b border-gray-200 focus:border-black outline-none py-2 transition-colors bg-white"
                      />
                    </div>

                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">
                        Miembro desde
                      </p>
                      <p className="text-[15px] text-black">
                        {new Date(user.created_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Preferencia de compra */}
                  <div className="flex flex-col gap-4 pt-6 border-t border-gray-100 max-w-[400px]">
                    <h4 className="text-[13px] font-medium text-black uppercase tracking-wider mb-2">
                      Preferencia de compra
                    </h4>
                    <div className="flex gap-3">
                      {[
                        { value: "men" as const, label: "Hombre" },
                        { value: "women" as const, label: "Mujer" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            handleGenderChange(
                              genderPreference === option.value
                                ? ""
                                : option.value,
                            )
                          }
                          className={`flex-1 py-3 text-[11px] uppercase tracking-[0.2em] border transition-colors ${
                            genderPreference === option.value
                              ? "bg-black text-white border-black"
                              : "bg-white text-black border-gray-200 hover:border-black"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 tracking-wide">
                      {genderPreference
                        ? `Verás colecciones de ${genderPreference === "men" ? "hombre" : "mujer"} al ir a comprar.`
                        : "Sin preferencia — serás redirigido al inicio."}
                    </p>
                  </div>

                  {/* Datos de la cuenta */}
                  <div className="flex flex-col gap-4 pt-6 border-t border-gray-100 max-w-[400px]">
                    <h4 className="text-[13px] font-medium text-black uppercase tracking-wider mb-2">
                      Datos de la cuenta
                    </h4>

                    <div className="flex items-center justify-between border border-gray-200 p-4 bg-white">
                      <div className="flex items-center gap-3">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-black"
                        >
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        <span className="text-[14px] text-black font-semibold">
                          {user.email}
                        </span>
                      </div>
                      <button className="text-[13px] text-black hover:text-gray-600 transition-colors">
                        Cambiar
                      </button>
                    </div>

                    <div className="flex items-center justify-between border border-gray-200 p-4 bg-white">
                      <div className="flex items-center gap-3">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-black"
                        >
                          <rect
                            width="18"
                            height="11"
                            x="3"
                            y="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span className="text-[14px] text-black font-semibold">
                          Contraseña
                        </span>
                      </div>
                      <button className="text-[13px] text-black hover:text-gray-600 transition-colors">
                        Cambiar
                      </button>
                    </div>

                    <button className="flex items-center justify-between border border-gray-200 p-4 bg-white w-full">
                      <div className="flex items-center gap-3">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-black"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                        <span className="text-[14px] text-black font-semibold">
                          Deshabilitar cuenta
                        </span>
                      </div>
                    </button>
                  </div>

                  <div className="max-w-[400px] mt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="w-full py-3.5 bg-black text-white text-[11px] uppercase tracking-[0.2em] hover:bg-gray-900 transition-colors"
                    >
                      {loading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "direcciones" && (
              <div className="w-full flex flex-col">
                <div className="flex justify-between items-center mb-12">
                  <h3 className="text-2xl font-medium text-black">
                    Direcciones guardadas
                  </h3>
                  {!showAddressForm && (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="text-[12px] font-medium text-black underline underline-offset-4 decoration-black hover:text-gray-600 transition-colors uppercase tracking-wider"
                    >
                      Añadir +
                    </button>
                  )}
                </div>

                {showAddressForm ? (
                  <form
                    onSubmit={handleAddAddress}
                    className="flex flex-col gap-6 w-full max-w-[400px]"
                  >
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] text-gray-400 uppercase tracking-widest">
                        Calle o Avenida
                      </label>
                      <input
                        required
                        type="text"
                        value={newAddress.street}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            street: e.target.value,
                          })
                        }
                        className="w-full text-[14px] text-black border-b border-gray-200 focus:border-black outline-none py-2 transition-colors bg-white"
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-2 w-1/2">
                        <label className="text-[11px] text-gray-400 uppercase tracking-widest">
                          Ciudad
                        </label>
                        <input
                          required
                          type="text"
                          value={newAddress.city}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              city: e.target.value,
                            })
                          }
                          className="w-full text-[14px] text-black border-b border-gray-200 focus:border-black outline-none py-2 transition-colors bg-white"
                        />
                      </div>
                      <div className="flex flex-col gap-2 w-1/2">
                        <label className="text-[11px] text-gray-400 uppercase tracking-widest">
                          Estado/Prov
                        </label>
                        <input
                          required
                          type="text"
                          value={newAddress.state}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              state: e.target.value,
                            })
                          }
                          className="w-full text-[14px] text-black border-b border-gray-200 focus:border-black outline-none py-2 transition-colors bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-2 w-1/2">
                        <label className="text-[11px] text-gray-400 uppercase tracking-widest">
                          CP
                        </label>
                        <input
                          required
                          type="text"
                          value={newAddress.zip_code}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              zip_code: e.target.value,
                            })
                          }
                          className="w-full text-[14px] text-black border-b border-gray-200 focus:border-black outline-none py-2 transition-colors bg-white"
                        />
                      </div>
                      <div className="flex flex-col gap-2 w-1/2">
                        <label className="text-[11px] text-gray-400 uppercase tracking-widest">
                          País
                        </label>
                        <input
                          required
                          type="text"
                          value={newAddress.country}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              country: e.target.value,
                            })
                          }
                          className="w-full text-[14px] text-black border-b border-gray-200 focus:border-black outline-none py-2 transition-colors bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4 mt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="flex-1 py-3 text-[11px] text-black border border-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={addingAddress}
                        className="flex-1 py-3 bg-black text-white text-[11px] uppercase tracking-[0.2em] hover:bg-gray-900 transition-colors"
                      >
                        {addingAddress ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {addresses.length === 0 ? (
                      <div className="flex flex-col justify-center items-center h-[100px]">
                        <p className="text-[15px] text-black text-center">
                          Aun no tienes direcciones guardadas.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 w-full">
                        {addresses.map((addr: any) => (
                          <div
                            key={addr.id}
                            className="border border-gray-200 p-5 bg-white flex flex-col gap-1"
                          >
                            <span className="text-[14px] font-semibold text-black">
                              {addr.street}
                            </span>
                            <span className="text-[13px] text-gray-500">
                              {addr.city}, {addr.state} {addr.zip_code}
                            </span>
                            <span className="text-[13px] text-gray-500">
                              {addr.country}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[90%] max-w-sm p-8 flex flex-col gap-6 shadow-xl">
            <h4 className="text-[15px] font-medium text-black tracking-tight">
              Tienes cambios sin guardar
            </h4>
            <p className="text-[13px] text-gray-500 leading-relaxed">
              Vas a salir sin haber guardado los cambios. ¿Qué deseas hacer?
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={confirmDiscard}
                className="flex-1 py-3 text-[11px] text-black border border-gray-200 uppercase tracking-[0.2em] hover:border-black transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={confirmSaveAndLeave}
                disabled={loading}
                className="flex-1 py-3 bg-black text-white text-[11px] uppercase tracking-[0.2em] hover:bg-gray-900 transition-colors"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
            <button
              onClick={() => {
                setShowUnsavedModal(false);
                setPendingAction(null);
              }}
              className="text-[12px] text-gray-400 hover:text-black transition-colors text-center"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
