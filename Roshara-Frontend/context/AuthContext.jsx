"use client";
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import api from "@lib/apiClient";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Normalize any backend response to a flat { _id, name, email, role, isAdmin, ... }
const normalizeUser = (raw) => {
  if (!raw) return null;

  // If backend sent { token, user: {...} } use the nested one
  const u = raw.user ? raw.user : raw;

  const role = u.role || (u.isAdmin ? "admin" : "customer");
  return {
    _id: u._id || u.id || null,
    name: u.name || "",
    email: u.email || "",
    role,
    isAdmin: u.isAdmin ?? role === "admin",
    phone: u.phone || "",
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user"); // may be raw or nested
      if (storedToken) {
        setToken(storedToken);
        api.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
      }
      if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
        const parsed = JSON.parse(storedUser);
        setUser(normalizeUser(parsed));
      }
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  const register = async (name, email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Registration failed" };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });

      // Backend shape is { token, user: {...} }
      const token = res.data?.token;
      const normalized = normalizeUser(res.data);

      setUser(normalized);
      setToken(token);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(normalized));

      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || "Login failed" };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common.Authorization;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

