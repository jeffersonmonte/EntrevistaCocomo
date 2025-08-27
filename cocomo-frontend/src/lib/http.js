// src/lib/http.js
import axios from "axios";

// Em DEV, deixe VITE_API_BASE_URL vazio e use o proxy do Vite.
// Em PROD/HML, defina VITE_API_BASE_URL (ex.: https://api.seuhost.com)
const baseURL = import.meta.env.VITE_API_BASE_URL || "";

export const http = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});
