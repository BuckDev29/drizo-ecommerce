const ENV_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim();
const PROD_FALLBACK_API_URL =
  "https://drizo-ecommerce-production.up.railway.app/api";
const LOCAL_FALLBACK_API_URL = "http://localhost:5000/api";

export const API_BASE_URL =
  ENV_API_URL ||
  (process.env.NODE_ENV === "production"
    ? PROD_FALLBACK_API_URL
    : LOCAL_FALLBACK_API_URL);

export function buildApiUrl(endpoint: string) {
  const normalizedEndpoint = endpoint.replace(/^\/+/, "");
  return `${API_BASE_URL}/${normalizedEndpoint}`;
}
