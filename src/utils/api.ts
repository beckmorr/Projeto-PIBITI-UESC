const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();

const API_BASE_URL = configuredBaseUrl || "/api";

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
