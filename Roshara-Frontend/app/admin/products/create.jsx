"use client";
import { useState } from "react";
import api from "../../../lib/apiClient"; 
import { useAuth } from "@context/AuthContext";
import { useRouter } from "next/navigation";

export default function CreateProductPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    images: "",
    collection: "",
    hasLiningOption: false,
    liningPrice: "",
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      setSaving(true);
      const payload = {
        ...form,
        images: form.images ? form.images.split(",").map((img) => img.trim()) : [],
        price: Number(form.price || 0),
        stock: Number(form.stock || 0),
        hasLiningOption: Boolean(form.hasLiningOption),
        liningPrice: form.hasLiningOption ? Number(form.liningPrice || 0) : null,
      };

      await api.post("/products", payload);
      router.push("/admin/products");
    } catch (error) {
      setErr(error?.response?.data?.message || error?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Add New Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        <input type="text" placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border p-2 rounded" required />
        <textarea placeholder="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border p-2 rounded" />
        <input type="number" placeholder="price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full border p-2 rounded" required />
        <input type="number" placeholder="stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full border p-2 rounded" />
        <input type="text" placeholder="collection" value={form.collection} onChange={(e) => setForm({ ...form, collection: e.target.value })} className="w-full border p-2 rounded" />
        <input type="text" placeholder="Image URLs (comma separated)" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className="w-full border p-2 rounded" />

        {/* Lining option fields */}
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.hasLiningOption}
              onChange={(e) => setForm({ ...form, hasLiningOption: e.target.checked })}
            />
            <span>Enable lining option for this product</span>
          </label>
        </div>

        {form.hasLiningOption && (
          <div>
            <input
              type="number"
              step="1"
              placeholder="Lining price (e.g. 1299)"
              value={form.liningPrice}
              onChange={(e) => setForm({ ...form, liningPrice: e.target.value })}
              className="w-full border p-2 rounded"
              required
            />
            <div className="text-xs text-gray-500 mt-1">When enabled, customers can choose "with lining" and pay the lining price.</div>
          </div>
        )}

        {err && <div className="text-sm text-red-600">{err}</div>}

        <button type="submit" className="bg-black text-white px-4 py-2 rounded" disabled={saving}>
          {saving ? "Saving..." : "Save Product"}
        </button>
      </form>
    </div>
  );
}
