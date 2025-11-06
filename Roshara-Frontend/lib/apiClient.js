// lib/apiClient.js
import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE,
  withCredentials: false, // if you require cookies, set to true
});

api.interceptors.request.use(
  (config) => {
    try {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {}
    return config;
  },
  (err) => Promise.reject(err)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err && err.response) {
      console.error("API Error:", err.response.status, err.response.data?.message || err.response.data);
    } else {
      console.error("API Error (no response):", err);
    }
    return Promise.reject(err);
  }
);

export default api;
