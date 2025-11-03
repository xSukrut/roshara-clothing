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
    collection: "",      // store collection _id
    discount: "",
  });
  const [collections, setCollections] = useState([]);
  const [message, setMessage] = useState("");

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
          images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
          collection: p.collection?._id || p.collection || "",
          discount: p.discount ?? p.discountPercent ?? "",
        });
      } catch (e) {
        if (alive) setMessage(e?.response?.data?.message || "Failed to load product");
      }
    })();

    return () => { alive = false; };
  }, [editId]);

  // Upload to /api/upload (support both "image" and "file")
  const handleUpload = async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    fd.append("file", file);
    const res = await api.post("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url || res.data.imageUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const payload = { ...form };

      ["price", "stock", "discount"].forEach((k) => {
        if (payload[k] !== "" && payload[k] !== null) payload[k] = Number(payload[k]);
      });

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
      setMessage(err?.response?.data?.message || "Error");
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">
        {editId ? "Edit" : "Add"} Product
      </h1>

      {message && (
        <p className={`mb-4 ${/success/i.test(message) ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image uploader */}
        <label className="block mb-2 font-medium">Upload Product Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const imageUrl = await handleUpload(file);
              setForm((prev) => ({ ...prev, images: [...(prev.images || []), imageUrl] }));
            } catch {
              // silent
            }
          }}
          className="w-full p-2 border rounded mb-3"
        />

        {form.images?.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {form.images.map((img, idx) => (
              <img
                key={idx}
                src={resolveImg(img)}
                alt="preview"
                className="w-20 h-20 object-cover border rounded"
              />
            ))}
          </div>
        )}

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

        <button type="submit" className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
          {editId ? "Update" : "Create"}
        </button>
      </form>
    </div>
  );
}
