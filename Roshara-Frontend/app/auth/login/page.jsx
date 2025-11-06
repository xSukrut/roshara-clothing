// app/auth/login/page.jsx
"use client";

import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const next = search?.get("next") || "/";

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
      router.push(next);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h2 className="text-2xl font-semibold mb-4">Login</h2>
      {error && <div className="text-red-600 mb-3">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={busy} className="w-full bg-black text-white py-2 rounded">
          {busy ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
