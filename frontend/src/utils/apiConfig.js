// export const API_BASE_URL = "http://13.201.52.124:3000";
export const API_BASE_URL = "https://api.madasamyi.me";

// export const API_BASE_URL = "http://localhost:3000";


export const buildApiUrl = (path = "") => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};
