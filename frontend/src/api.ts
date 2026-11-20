import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");
const apiBaseUrl = configuredApiUrl
  ? `${configuredApiUrl.replace(/\/api$/i, "")}/api`
  : import.meta.env.DEV
  ? "http://localhost:4000/api"
  : "/api";

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});
