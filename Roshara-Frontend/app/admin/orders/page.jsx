"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import {
  listOrdersAdmin,
  adminUpdateOrderStatus,
} from "../../../services/orderService";

/* Robust extractor helpers (keeps many alias names in mind) */
function extractSize(it) {
  if (!it) return null;
  // check common keys in the orderItem object
  const keys = [
    "size",
    "selectedSize",
    "selected_size",
    "selected",
    "sizeLabel",
    "selectedSizeLabel",
    "chosenSize",
    "size_label",
    "sizeName",
    "selectedSizeValue",
    "variant",
  ];
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(it, k)) {
      const v = it[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
    }
  }
  // fallback into product subdocument (sometimes frontend nested chosen size there)
  if (it.product && typeof it.product === "object") {
    const pkeys = ["selectedSize", "size", "defaultSize", "sizeLabel", "variant"];
    for (const pk of pkeys) {
      if (Object.prototype.hasOwnProperty.call(it.product, pk)) {
        const v = it.product[pk];
        if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
      }
    }
  }
  return null;
}

function extractCustomSize(it) {
  if (!it) return null;
  const aliases = ["customSize", "custom", "measurements", "customMeasurements", "custom_size", "measurement"];
  let cand = null;
  for (const a of aliases) {
    if (Object.prototype.hasOwnProperty.call(it, a) && it[a] != null) {
      cand = it[a];
      break;
    }
  }
  // fallback to product subdoc
  if (!cand && it.product && typeof it.product === "object") {
    for (const a of aliases) {
      if (Object.prototype.hasOwnProperty.call(it.product, a) && it.product[a] != null) {
        cand = it.product[a];
        break;
      }
    }
  }
  if (!cand) return null;
  let obj = cand;
  if (typeof cand === "string") {
    try {
      obj = JSON.parse(cand);
    } catch {
      // try to parse a simple `bust:36,waist:28` string
      const kv = {};
      cand.split(",").forEach((p) => {
        const [k, v] = p.split(":").map(s => (s ? s.trim() : ""));
        if (k && v) kv[k] = v;
      });
      if (Object.keys(kv).length) obj = kv;
    }
  }
  const out = {
    bust: obj?.bust ? String(obj.bust).trim() : undefined,
    waist: obj?.waist ? String(obj.waist).trim() : undefined,
    hips: obj?.hips ? String(obj.hips).trim() : undefined,
    shoulder: obj?.shoulder ? String(obj.shoulder).trim() : undefined,
  };
  // if completely empty => null
  if (!out.bust && !out.waist && !out.hips && !out.shoulder) return null;
  return out;
}

function customSizeSummary(cs) {
  if (!cs) return null;
  const parts = [];
  if (cs.bust) parts.push(`bust ${cs.bust}`);
  if (cs.waist) parts.push(`waist ${cs.waist}`);
  if (cs.hips) parts.push(`hips ${cs.hips}`);
  if (cs.shoulder) parts.push(`shoulder ${cs.shoulder}`);
  return parts.length ? parts.join(", ") : null;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(""); // "", pending_verification, paid, rejected
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState({}); // map orderId => bool for raw JSON expand

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
      console.error("Failed to load admin orders:", e);
      const message =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load orders. Check backend logs.";
      setError(message);
      setOrders([]);
    }
  };

  useEffect(() => {
    if (!token || loading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loading]);

  const handleFilter = async (e) => {
    e?.preventDefault?.();
    await load();
  };

  const mark = async (id, action) => {
    try {
      setBusyId(id);
      // action is "paid" or "rejected"
      await adminUpdateOrderStatus(token, id, action);
      await load();
    } catch (e) {
      console.error("Update failed:", e);
      setError(e?.response?.data?.message || e?.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading || !user) return <div className="p-6">Loading…</div>;
  if (!(user.role === "admin" || user.isAdmin)) return null;

  return (
    <div className="max-w-8xl mx-auto p-6">
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

      {error && <p className="text-red-600 mb-3">Error: {error}</p>}

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left align-top">
              <Th>#</Th>
              <Th>Order</Th>
              <Th>User</Th>
              <Th>Items</Th>
              <Th>Ship To</Th>
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
              <tr key={o._id} className="border-t align-top">
                <Td>{idx + 1}</Td>
                <Td className="font-mono">{o._id}</Td>

                <Td>
                  <div className="flex flex-col">
                    <span className="font-medium">{o.user?.name || "-"}</span>
                    <span className="text-gray-500">{o.user?.email || "-"}</span>
                  </div>
                </Td>

                {/* Items column: shows name, qty, size/custom, lining, extra */}
                <Td className="max-w-md align-top">
                  {Array.isArray(o.orderItems) && o.orderItems.length ? (
                    <ul className="space-y-2">
                      {o.orderItems.map((it, i) => {
                        const size = extractSize(it);
                        const cs = extractCustomSize(it);
                        const csSummary = customSizeSummary(cs);
                        return (
                          <li key={it._id || `${it.product}-${i}`} className="text-sm">
                            <div className="font-medium">{it.name}</div>
                            <div className="text-xs text-gray-600">
                              Qty: {it.quantity ?? it.qty ?? 1}
                              {" • "}
                              Size: {size ? size : (csSummary ? `(custom)` : <span className="text-gray-400">(not detected)</span>)}
                              {csSummary ? ` • Custom: ${csSummary}` : ""}
                              {it.lining ? ` • Lining: ${it.lining}` : ""}
                              {it.extra ? ` • Surcharge: ₹${it.extra}` : ""}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <span className="text-gray-500">No items</span>
                  )}
                  {/* Raw JSON toggle */}
                  <div className="mt-2">
                    <button
                      onClick={() => setExpanded((prev) => ({ ...prev, [o._id]: !prev[o._id] }))}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {expanded[o._id] ? "Hide raw JSON" : "Expand raw JSON"}
                    </button>
                    {expanded[o._id] && (
                      <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto max-h-44">
                        {JSON.stringify(o.orderItems, null, 2)}
                      </pre>
                    )}
                  </div>
                </Td>

                {/* Shipping address column */}
                <Td className="align-top">
                  {o.shippingAddress && (o.shippingAddress.address || o.shippingAddress.city || o.shippingAddress.postalCode || o.shippingAddress.country) ? (
                    <div className="text-sm">
                      {o.shippingAddress.address && <div>{o.shippingAddress.address}</div>}
                      <div>
                        {(o.shippingAddress.city ? o.shippingAddress.city + ", " : "")}
                        {(o.shippingAddress.postalCode ? o.shippingAddress.postalCode + ", " : "")}
                        {(o.shippingAddress.country ? o.shippingAddress.country : "")}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </Td>

                <Td>₹{Number(o.totalPrice ?? o.itemsPrice ?? 0)}</Td>
                <Td>{(o.paymentMethod || "-").toString().toUpperCase()}</Td>
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
                <Td className="font-mono text-xs">{o.upi?.txnId || "-"}</Td>
                <Td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}</Td>
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
                <Td colSpan={11} className="text-center text-gray-500 py-6">
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

/* helpers */
function Th({ children }) {
  return <th className="px-3 py-2 font-semibold align-top">{children}</th>;
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
