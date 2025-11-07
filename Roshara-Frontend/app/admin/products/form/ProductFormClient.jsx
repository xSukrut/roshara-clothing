"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/apiClient";
import { resolveImg } from "@/utils/img";

export default function ProductFormClient({ editId }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    images: [],
    collection: "", // store collection _id
    discount: "",
    // lining fields
    hasLiningOption: false,
    liningPrice: "",
  });
  const [collections, setCollections] = useState([]);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  // Load collections + product (if editing)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const colRes = await api.get("/collections");
        if (alive) setCollections(Array.isArray(colRes.data) ? colRes.data : []);
      } catch {
        if (alive) setCollections([]);
      }

      if (!editId) return;

      try {
        const res = await api.get(`/products/${editId}`);
        const p = res.data || {};
        if (!alive) return;

        setForm({
          name: p.name || "",
          description: p.description || "",
          price: p.price ?? "",
          stock: p.stock ?? "",
          images: Array.isArray(p.images) ? p.images : p.image ? [p.image] : [],
          collection: p.collection?._id || p.collection || "",
          discount: p.discount ?? p.discountPercent ?? "",
          hasLiningOption: Boolean(p.hasLiningOption),
          liningPrice: p.liningPrice ?? "",
        });
      } catch (e) {
        if (alive) setMessage(e?.response?.data?.message || "Failed to load product");
      }
    })();

    return () => {
      alive = false;
    };
  }, [editId]);

  /**
   * Upload to /api/upload (Cloudinary-backed).
   * IMPORTANT: do NOT set Content-Type manually when sending FormData
   * — the browser will attach the boundary for us.
   */
  const handleUpload = async (file) => {
    const fd = new FormData();
    fd.append("image", file); // backend accepts "image"

    setUploading(true);
    try {
      const res = await api.post("/upload", fd, {
        // DO NOT set Content-Type here
        // headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res?.data?.url || res?.data?.imageUrl;
      if (!url) throw new Error("Upload response missing url");

      // Add to images array
      setForm((prev) => ({ ...prev, images: [...(prev.images || []), url] }));
    } finally {
      setUploading(false);
    }
  };

  const removeImageAt = (idx) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const payload = { ...form };

      // coerce numeric fields
      ["price", "stock", "discount"].forEach((k) => {
        if (payload[k] !== "" && payload[k] !== null) payload[k] = Number(payload[k]);
      });

      // lining price handling
      if (payload.hasLiningOption) {
        // ensure liningPrice is present and positive
        if (payload.liningPrice === "" || payload.liningPrice === null) {
          setMessage("Please enter a lining price (positive number) or disable lining option.");
          return;
        }
        payload.liningPrice = Number(payload.liningPrice);
        if (!Number.isFinite(payload.liningPrice) || payload.liningPrice <= 0) {
          setMessage("Lining price must be a positive number.");
          return;
        }
      } else {
        // if lining is disabled, send null to clear on backend
        payload.liningPrice = null;
      }

      // images already array
      if (payload.collection === "") delete payload.collection;

      if (editId) {
        await api.put(`/products/${editId}`, payload);
        setMessage("Updated successfully!");
      } else {
        await api.post(`/products`, payload);
        setMessage("Created successfully!");
      }

      setTimeout(() => router.push("/admin/products"), 800);
    } catch (err) {
      setMessage(err?.response?.data?.message || err?.message || "Error");
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">{editId ? "Edit" : "Add"} Product</h1>

      {message && (
        <p className={`mb-4 ${/success/i.test(message) ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image uploader */}
        <div>
          <label className="block mb-2 font-medium">Upload Product Image</label>
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                await handleUpload(file);
              } catch (err) {
                setMessage(err?.message || "Upload failed");
              } finally {
                e.target.value = ""; // reset
              }
            }}
            className="w-full p-2 border rounded mb-3"
          />

          {uploading && <div className="text-sm text-gray-500 mb-2">Uploading…</div>}

          {form.images?.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resolveImg(img)} alt="preview" className="w-20 h-20 object-cover border rounded" />
                  <button
                    type="button"
                    onClick={() => removeImageAt(idx)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black text-white text-xs"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Product name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full p-2 border rounded"
        />

        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full p-2 border rounded"
        />

        <input
          type="number"
          placeholder="Stock"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          className="w-full p-2 border rounded"
        />

        <select
          value={form.collection}
          onChange={(e) => setForm({ ...form, collection: e.target.value })}
          className="w-full p-2 border rounded"
        >
          <option value="">Select Collection</option>
          {collections.map((col) => (
            <option key={col._id} value={col._id}>
              {col.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Discount %"
          value={form.discount}
          onChange={(e) => setForm({ ...form, discount: e.target.value })}
          className="w-full p-2 border rounded"
        />

        {/* Lining option */}
        <div className="flex flex-col gap-2">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(form.hasLiningOption)}
              onChange={(e) => {
                const checked = e.target.checked;
                setForm((prev) => ({
                  ...prev,
                  hasLiningOption: checked,
                  // if turning off, clear liningPrice in UI
                  liningPrice: checked ? prev.liningPrice : "",
                }));
              }}
            />
            <span>Enable with/without lining option for this product</span>
          </label>

          {form.hasLiningOption && (
            <div>
              <input
                type="number"
                step="1"
                placeholder="Lining price (e.g. 1299)"
                value={form.liningPrice}
                onChange={(e) => setForm({ ...form, liningPrice: e.target.value })}
                className="w-full p-2 border rounded"
                required={form.hasLiningOption}
                min={1}
              />
              <p className="text-xs text-gray-500 mt-1">
                When enabled, customers can choose "with lining" and pay the lining price. Server will also validate this.
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {editId ? "Update" : "Create"}
        </button>
      </form>
    </div>
  );
}
