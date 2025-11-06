// context/AuthContext.jsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import api from "../lib/apiClient";
import * as authService from "../services/authService";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const u = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (t) {
        setToken(t);
        api.defaults.headers.common.Authorization = `Bearer ${t}`;
      }
      if (u) {
        try { setUser(JSON.parse(u)); } catch { setUser(null); }
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = (tkn, userObj) => {
    try {
      if (typeof window !== "undefined") {
        if (tkn) localStorage.setItem("token", tkn);
        else localStorage.removeItem("token");
        if (userObj) localStorage.setItem("user", JSON.stringify(userObj));
        else localStorage.removeItem("user");
      }
    } catch {}
    setToken(tkn);
    setUser(userObj || null);
    if (tkn) api.defaults.headers.common.Authorization = `Bearer ${tkn}`;
    else delete api.defaults.headers.common.Authorization;
  };

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (!data || !data.token) throw new Error("Login failed");
    persist(data.token, data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    if (!data || !data.token) throw new Error("Registration failed");
    persist(data.token, data.user);
    return data;
  };

  const logout = () => {
    persist(null, null);
    try { router.push("/"); } catch {}
  };

  const refreshProfile = async () => {
    try {
      const profile = await authService.getProfile();
      if (profile) {
        setUser(profile);
        localStorage.setItem("user", JSON.stringify(profile));
      }
      return profile;
    } catch (e) {
      console.error("refreshProfile error", e);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = { children: PropTypes.node.isRequired };
