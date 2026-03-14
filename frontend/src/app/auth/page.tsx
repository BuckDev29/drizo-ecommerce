"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import useApiRequest from "@/hooks/useApiRequest";
import "./Auth.css";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apiRequest, loading } = useApiRequest();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({ email: "", password: "" });

    const errors = { email: "", password: "" };
    if (!formData.email.trim()) errors.email = "invalid";
    if (!formData.password.trim()) errors.password = "invalid";

    if (errors.email || errors.password) {
      setFieldErrors(errors);
      setError(
        "El valor ingresado no es válido. Por favor, verificalo e intenta nuevamente.",
      );
      return;
    }

    try {
      const data = await apiRequest("auth/login", false, "POST", formData);
      localStorage.setItem("token", data.token);
      document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
      window.dispatchEvent(new Event("auth-change"));
      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Email o contraseña incorrectos");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name as keyof typeof fieldErrors] || error) {
      setFieldErrors({ email: "", password: "" });
      setError("");
    }
  };

  return (
    <div className="auth-container">
      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-welcome">
            <h2>Inicia sesión</h2>
          </div>

          {error && <div className="auth-error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className={fieldErrors.email ? "error" : ""}
              />
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
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.06 10.06 0 0 1 12 20C7 20 2.73 16.11 1 12c.73-1.67 1.81-3.21 3.06-4.47M9.88 9.88A3 3 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .39-.08.76-.22 1.1" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-footer">
              <Link href="#" className="forgot-password">
                ¿Has olvidado tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading ? "Iniciando..." : "Iniciar Sesión"}
            </button>

            <button
              type="button"
              className="auth-register-button"
              onClick={() => router.push("/register")}
            >
              Registrarse
            </button>
          </form>

          <div className="social-login">
            <span className="forgot-password block text-center mb-4">
              Acceder con
            </span>
            <div className="social-buttons">
              <button className="social-button">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button className="social-button">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel Image */}
        <div className="auth-side hidden md:flex items-center justify-center bg-[#0f1114] relative overflow-hidden">
          <div className="absolute inset-0 opacity-80 pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(1200px_500px_at_10%_-10%,rgba(255,255,255,0.12),transparent_55%),radial-gradient(900px_450px_at_100%_0%,rgba(120,140,160,0.18),transparent_60%)]" />
          <div className="relative z-10 w-full h-full">
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-hidden">
                <img
                  src="/assets/auth.jpg"
                  alt="Auth Background"
                  className="w-full h-full object-cover saturate-[0.95] contrast-[1.05]"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
