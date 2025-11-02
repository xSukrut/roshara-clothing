"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { listOrdersAdmin, adminVerifyOrder, adminUpdateOrderStatus } from "../../../services/orderService";

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(""); // "", pending_verification, paid, rejected
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  // guard: only admin
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login?next=/admin/orders");
      return;
    }
    if (!(user.role === "admin" || user.isAdmin)) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const load = async () => {
    try {
      setError("");
      const data = await listOrdersAdmin(token, { q, status });
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load orders");
    }
  };

  useEffect(() => {
    if (!token || loading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loading]);

  const handleFilter = async (e) => {
    e.preventDefault();
    await load();
  };

const mark = async (id, action) => {
  try {
    setBusyId(id);
    // action is "paid" or "rejected"
    await adminUpdateOrderStatus(token, id, action);
    await load();
  } catch (e) {
    setError(e?.response?.data?.message || "Update failed");
  } finally {
    setBusyId(null);
  }
}

  if (loading || !user) return <div className="p-6">Loading…</div>;
  if (!(user.role === "admin" || user.isAdmin)) return null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Orders (Admin)</h1>

      <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by Order ID / email / name"
          className="border rounded px-3 py-2 flex-1"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All statuses</option>
          <option value="pending_verification">Pending verification</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>
        <button className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">
          Apply
        </button>
      </form>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <Th>#</Th>
              <Th>Order</Th>
              <Th>User</Th>
              <Th>Amount</Th>
              <Th>Pay Method</Th>
              <Th>Status</Th>
              <Th>UPI Txn</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, idx) => (
              <tr key={o._id} className="border-t">
                <Td>{idx + 1}</Td>
                <Td className="font-mono">{o._id}</Td>
                <Td>
                  <div className="flex flex-col">
                    <span className="font-medium">{o.user?.name || "-"}</span>
                    <span className="text-gray-500">{o.user?.email || "-"}</span>
                  </div>
                </Td>
                <Td>₹{Number(o.totalPrice ?? o.itemsPrice ?? 0)}</Td>
                <Td>{o.paymentMethod?.toUpperCase?.() || "-"}</Td>
                <Td>
                  <Badge
                    color={
                      (o.paymentStatus || o.status) === "paid"
                        ? "green"
                        : (o.paymentStatus || o.status) === "rejected"
                        ? "red"
                        : "amber"
                    }
                  >
                    {o.paymentStatus || o.status || "pending"}
                  </Badge>
                </Td>
                <Td className="font-mono text-xs">
                  {o.upi?.txnId || "-"}
                </Td>
                <Td>{new Date(o.createdAt).toLocaleString()}</Td>
                <Td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => mark(o._id, "paid")}
                      disabled={busyId === o._id}
                      className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      title="Mark as Paid"
                    >
                      {busyId === o._id ? "…" : "Mark Paid"}
                    </button>
                    <button
                      onClick={() => mark(o._id, "rejected")}
                      disabled={busyId === o._id}
                      className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      title="Reject Payment"
                    >
                      {busyId === o._id ? "…" : "Reject"}
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <Td colSpan={9} className="text-center text-gray-500 py-6">
                  No orders found.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th className="px-3 py-2 font-semibold">{children}</th>;
}
function Td({ children, className = "", colSpan }) {
  return (
    <td className={`px-3 py-2 align-top ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
function Badge({ children, color = "gray" }) {
  const map = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs ${map[color]}`}>
      {children}
    </span>
  );
}
