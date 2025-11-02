"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listMyOrders } from "@/services/orderService";

function StatusBadge({ status }) {
  const map = {
    paid: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    pending_verification: "bg-amber-100 text-amber-700",
    pending: "bg-amber-100 text-amber-700",
  };
  const cls = map[status] || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs ${cls}`}>
      {status || "pending"}
    </span>
  );
}

export default function MyOrdersPage() {
  const { user, token, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!token || loading) return;
    (async () => {
      try {
        setErr("");
        const data = await listMyOrders(token);
        setOrders(data);
      } catch (e) {
        setErr("Failed to load your orders.");
      }
    })();
  }, [token, loading]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return <div className="p-6">Please sign in to view your orders.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>

      {err && <p className="text-red-600 mb-3">{err}</p>}

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold">#</th>
              <th className="px-3 py-2 font-semibold">Order</th>
              <th className="px-3 py-2 font-semibold">Items</th>
              <th className="px-3 py-2 font-semibold">Total</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Placed</th>
              <th className="px-3 py-2 font-semibold">View</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={o._id} className="border-t">
                <td className="px-3 py-2">{i + 1}</td>
                <td className="px-3 py-2 font-mono">{o._id}</td>
                <td className="px-3 py-2">
                  {Array.isArray(o.orderItems)
                    ? o.orderItems.map((it) => it.name).join(", ")
                    : "-"}
                </td>
                <td className="px-3 py-2">₹{Number(o.totalPrice ?? 0)}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={o.paymentStatus || o.status} />
                </td>
                <td className="px-3 py-2">
                  {o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/account/orders/${o._id}`}
                    className="text-black hover:underline"
                  >
                    Details →
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                  You don’t have any orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
