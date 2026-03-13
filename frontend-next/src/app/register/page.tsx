"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useApiRequest from "@/hooks/useApiRequest";
import "../auth/Auth.css";

export default function RegisterPage() {
  const router = useRouter();
  const { apiRequest, loading } = useApiRequest();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "El nombre es requerido";
    if (!formData.email.trim()) {
      errors.email = "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Formato de email inválido";
    }
    if (!formData.password) {
      errors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await apiRequest("auth/register", false, "POST", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      router.push("/auth");
    } catch (err: any) {
      setError(err.message || "Error de conexión");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name] || error) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
      setError("");
    }
  };

  return (
    <div className="auth-container">
      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-welcome">
            <h2>Crear cuenta</h2>
            <p>Únete a Drizo hoy</p>
          </div>

          {error && <div className="auth-error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nombre completo"
                className={fieldErrors.name ? "error" : ""}
              />
              {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            </div>

            <div className="form-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className={fieldErrors.email ? "error" : ""}
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>

            <div className="form-group password-group">
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Contraseña"
                  className={fieldErrors.password ? "error" : ""}
                />
                <button
                  type="button"
                  className="show-password-btn"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.06 10.06 0 0 1 12 20C7 20 2.73 16.11 1 12c.73-1.67 1.81-3.21 3.06-4.47M9.88 9.88A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .39-.08.76-.22 1.1" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            </div>

            <div className="form-group password-group">
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirmar contraseña"
                  className={fieldErrors.confirmPassword ? "error" : ""}
                />
                <button
                  type="button"
                  className="show-password-btn"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.06 10.06 0 0 1 12 20C7 20 2.73 16.11 1 12c.73-1.67 1.81-3.21 3.06-4.47M9.88 9.88A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .39-.08.76-.22 1.1" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}
            </div>

            <button type="submit" className="auth-submit-button" disabled={loading}>
              {loading ? "Creando..." : "Crear Cuenta"}
            </button>
            
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-500">¿Ya tienes una cuenta? </span>
              <Link href="/auth" className="forgot-password font-medium underline">
                Inicia sesión
              </Link>
            </div>
          </form>
        </div>
        
        {/* Side Panel Image */}
        <div className="auth-side hidden md:flex items-center justify-center bg-[#0f1114] relative overflow-hidden">
          <div className="absolute inset-0 opacity-80 pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(1200px_500px_at_10%_-10%,rgba(255,255,255,0.12),transparent_55%),radial-gradient(900px_450px_at_100%_0%,rgba(120,140,160,0.18),transparent_60%)]" />
          <div className="relative z-10 w-full h-full">
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-hidden">
                <img src="/assets/auth.jpg" alt="Auth Background" className="w-full h-full object-cover saturate-[0.95] contrast-[1.05]" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
