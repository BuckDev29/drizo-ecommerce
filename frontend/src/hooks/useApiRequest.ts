import { useCallback, useState } from "react";
import { buildApiUrl } from "@/lib/api";

function redirectToLogin() {
  if (typeof window === "undefined") return;

  const redirect = `${window.location.pathname}${window.location.search}`;
  const authUrl = `/auth?redirect=${encodeURIComponent(redirect)}`;

  localStorage.removeItem("token");
  document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
  window.dispatchEvent(new Event("auth-change"));

  if (!window.location.pathname.startsWith("/auth")) {
    window.location.replace(authUrl);
  }
}

function isAuthError(status: number, message?: string) {
  const normalized = (message || "").toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    normalized.includes("invalid token") ||
    normalized.includes("token inval") ||
    normalized.includes("unauthorized") ||
    normalized.includes("no tienes autorizacion") ||
    normalized.includes("jwt malformed") ||
    normalized.includes("jwt expired")
  );
}

const useApiRequest = () => {
  const [loading, setLoading] = useState(false);

  /**
   * @param endpoint string (e.g., "auth/login", not "/auth/login")
   * @param authRequired boolean
   * @param method string
   * @param data any
   * @param isFile boolean
   * @param isFormUrlEncoded boolean (optional)
   * @param token string (optional) - pass token manually if needed
   */
  const apiRequest = useCallback(
    async (
      endpoint: string,
      authRequired: boolean = false,
      method: string = "GET",
      data: any = null,
      isFile: boolean = false,
      isFormUrlEncoded: boolean = false,
      token?: string,
    ) => {
      setLoading(true);

      try {
        const url = buildApiUrl(endpoint);
        let options: RequestInit = {
          method,
          headers: {} as Record<string, string>,
        };

        // Si es una petición con datos (POST o PUT, o DELETE)
        if (data) {
          if (data instanceof FormData) {
            options.body = data;
          } else if (isFile) {
            const formData = new FormData();
            for (const key in data) {
              formData.append(key, data[key]);
            }
            options.body = formData;
          } else if (isFormUrlEncoded) {
            (options.headers as Record<string, string>)["Content-Type"] =
              "application/x-www-form-urlencoded";
            options.body = Object.keys(data)
              .map(
                (key) =>
                  encodeURIComponent(key) + "=" + encodeURIComponent(data[key]),
              )
              .join("&");
          } else {
            (options.headers as Record<string, string>)["Content-Type"] =
              "application/json";
            options.body = JSON.stringify(data);
          }
        }

        if (authRequired && token) {
          (options.headers as Record<string, string>)["Authorization"] =
            `Bearer ${token}`;
        }

        const response = await fetch(url, options);
        const result = await response.json();

        if (!response.ok) {
          if (authRequired && isAuthError(response.status, result.message)) {
            redirectToLogin();
          }
          throw new Error(result.message || "Error en la petición");
        }

        return result;
      } catch (error) {
        console.log("API Error:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { apiRequest, loading };
};

export default useApiRequest;
