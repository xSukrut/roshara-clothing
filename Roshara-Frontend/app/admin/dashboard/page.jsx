// app/admin/page.jsx
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || !(user.role === "admin" || user.isAdmin)) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (!user || !(user.role === "admin" || user.isAdmin)) return null;

  const card =
    "block border rounded-xl p-6 hover:shadow-md transition w-full text-lg";

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/products" className={card}>
          Manage Products →
        </Link>

        <Link href="/admin/collections" className={card}>
          Manage Collections →
        </Link>

        <Link href="/admin/orders" className={card}>
          Orders & UPI Verification →
        </Link>

        <Link href="/admin/coupons" className={card}>
          Manage Coupons →
        </Link>
      </div>
    </div>
  );
}
