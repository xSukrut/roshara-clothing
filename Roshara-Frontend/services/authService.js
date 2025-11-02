// services/authService.js
import api from "@lib/apiClient";

export const register = async ({ name, email, password }) => {
  const res = await api.post("/auth/register", { name, email, password });
  return res.data; // { _id, name, email, role, token }
};

export const login = async ({ email, password }) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data; // { _id, name, email, role, token }
};
