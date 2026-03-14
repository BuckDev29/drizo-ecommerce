export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function buildApiUrl(endpoint: string) {
  const normalizedEndpoint = endpoint.replace(/^\/+/, "");
  return `${API_BASE_URL}/${normalizedEndpoint}`;
}
