// app/admin/coupons/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import {
  listCouponsAdmin,
  createCouponAdmin,
  updateCouponAdmin,
  deleteCouponAdmin,
} from "@/services/couponService";

const EMPTY = {
  code: "",
  discountType: "percentage", // "percentage" | "amount"
  value: "",
  minOrderAmount: "",
  expiryDate: "", // yyyy-mm-dd from <input type="date">
  active: true,
};

export default function AdminCouponsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Guard: admin only
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login?next=/admin/coupons");
      return;
    }
    if (!(user.role === "admin" || user.isAdmin)) {
      router.replace("/");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  async function load() {
    try {
      setError("");
      const data = await listCouponsAdmin(token);
      setCoupons(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load coupons");
    }
  }

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function toPayload(f) {
    return {
      code: (f.code || "").trim().toUpperCase(),
      discountType: f.discountType, // "percentage" | "amount"
      value: Number(f.value || 0),
      minOrderAmount: Number(f.minOrderAmount || 0),
      expiryDate: f.expiryDate ? new Date(f.expiryDate).toISOString() : null,
      active: !!f.active,
    };
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setBusy(true);
      setError("");
      const payload = toPayload(form);

      if (editingId) {
        await updateCouponAdmin(token, editingId, payload);
      } else {
        await createCouponAdmin(token, payload);
      }

      setForm(EMPTY);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(c) {
    setEditingId(c._id);
    setForm({
      code: c.code || "",
      discountType: c.discountType || "percentage",
      value: c.value ?? "",
      minOrderAmount: c.minOrderAmount ?? "",
      expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().slice(0, 10) : "",
      active: !!c.active,
    });
  }

  async function remove(id) {
    if (!confirm("Delete this coupon?")) return;
    try {
      setBusy(true);
      await deleteCouponAdmin(token, id);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Coupons</h1>
      {error && <p className="text-red-600 mb-3">{error}</p>}

      {/* Form */}
      <form onSubmit={onSubmit} className="border rounded p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Code</label>
            <input
              name="code"
              value={form.code}
              onChange={onChange}
              placeholder="ROSHARA10"
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Type</label>
            <select
              name="discountType"
              value={form.discountType}
              onChange={onChange}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="percentage">percentage</option>
              <option value="amount">amount</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Value</label>
            <input
              name="value"
              type="number"
              min="0"
              value={form.value}
              onChange={onChange}
              placeholder="10 (10% if percentage)"
              className="border rounded px-3 py-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Min Order Amount</label>
            <input
              name="minOrderAmount"
              type="number"
              min="0"
              value={form.minOrderAmount}
              onChange={onChange}
              placeholder="e.g. 1899"
              className="border rounded px-3 py-2 w-full"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Expiry Date</label>
            <input
              name="expiryDate"
              type="date"
              value={form.expiryDate}
              onChange={onChange}
              className="border rounded px-3 py-2 w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="active"
              name="active"
              type="checkbox"
              checked={form.active}
              onChange={onChange}
            />
            <label htmlFor="active">Active</label>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            disabled={busy}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setForm(EMPTY);
                setEditingId(null);
              }}
              className="border px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <Th>Code</Th>
              <Th>Type</Th>
              <Th>Value</Th>
              <Th>Min Amount</Th>
              <Th>Expiry</Th>
              <Th>Active</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c._id} className="border-t">
                <Td className="font-mono">{c.code}</Td>
                <Td>{c.discountType}</Td>
                <Td>{c.discountType === "percentage" ? `${c.value}%` : `₹${c.value}`}</Td>
                <Td>{c.minOrderAmount ? `₹${c.minOrderAmount}` : "-"}</Td>
                <Td>{c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : "-"}</Td>
                <Td>{c.active ? "Yes" : "No"}</Td>
                <Td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(c)}
                      className="px-3 py-1 rounded border"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(c._id)}
                      className="px-3 py-1 rounded bg-red-600 text-white"
                    >
                      Delete
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <Td colSpan={7} className="text-center text-gray-500 py-6">
                  No coupons yet.
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
