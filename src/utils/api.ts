const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();

const API_BASE_URL = configuredBaseUrl || (import.meta.env.DEV ? "http://127.0.0.1:8000" : "/api");

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
