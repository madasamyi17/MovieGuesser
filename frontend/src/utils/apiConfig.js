export const API_BASE_URL = "http://13.233.208.54:3000".replace(/\/+$/, "");
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";


export const buildApiUrl = (path = "") => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};