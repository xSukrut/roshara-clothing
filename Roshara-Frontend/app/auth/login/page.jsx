"use client";
export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  // Handle next redirect param
  const [nextPath, setNextPath] = useState("/");
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const nx = params.get("next");
        if (nx) setNextPath(nx);
      }
    } catch (e) {}
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.push(nextPath || "/");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4 text-center">Login</h2>

        {error && <div className="text-red-600 mb-3 text-center">{error}</div>}

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full border rounded px-3 py-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            disabled={busy}
            className="w-full bg-black text-white py-2 rounded font-medium hover:bg-gray-800 transition-colors"
          >
            {busy ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* 👇 Register link visible on all devices (especially mobile) */}
        <div className="mt-6 text-center border-t pt-4">
          <p className="text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-black font-semibold hover:underline"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
