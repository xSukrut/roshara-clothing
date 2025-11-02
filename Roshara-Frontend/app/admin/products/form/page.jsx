"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@lib/apiClient";

const asImg = (src) => (src?.startsWith("http") ? src : `http://localhost:5000${src}`);

export default function ProductForm() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    images: [],
    collection: "",
    discount: "",
  });
  const [collections, setCollections] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/collections").then((res) => setCollections(res.data));
    if (id) {
      api.get(`/products/${id}`).then((res) => {
        const p = res.data;
        setForm({
          ...p,
          images: Array.isArray(p.images) ? p.images : [],
          collection: p.collection?.name || "",
        });
      });
    }
  }, [id]);

  const handleUpload = async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    const res = await api.post("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.imageUrl; // "/uploads/xyz.jpg"
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };

      // if user typed a string in price/stock/discount ensure numbers
      ["price", "stock", "discount"].forEach((k) => {
        if (payload[k] !== "" && payload[k] !== null) payload[k] = Number(payload[k]);
      });

      if (id) {
        await api.put(`/products/${id}`, payload);
        setMessage("Updated successfully!");
      } else {
        await api.post(`/products`, payload);
        setMessage("Created successfully!");
      }
      setTimeout(() => router.push("/admin/products"), 800);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">{id ? "Edit" : "Add"} Product</h1>
      {message && <p className="mb-4 text-green-600">{message}</p>}

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
              setForm((prev) => ({ ...prev, images: [...prev.images, imageUrl] }));
            } catch (error) {
              console.error("Upload failed", error);
            }
          }}
          className="w-full p-2 border rounded mb-3"
        />

        {form.images?.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {form.images.map((img, idx) => (
              <img
                key={idx}
                src={asImg(img)}
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
            <option key={col._id} value={col.name}>
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
          {id ? "Update" : "Create"}
        </button>
      </form>
    </div>
  );
}
