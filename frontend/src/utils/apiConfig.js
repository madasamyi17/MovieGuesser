const processEnvApiBase =
  typeof process !== "undefined"
    ? process.env?.VITE_API_BASE_URL || process.env?.VITE_BACKEND_URL
    : undefined;

const viteApiBase =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;

export const API_BASE_URL = (viteApiBase || processEnvApiBase || "http://localhost:3000").replace(/\/+$/, "");

export const buildApiUrl = (path = "") => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};
