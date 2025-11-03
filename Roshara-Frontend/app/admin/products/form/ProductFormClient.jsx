"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/apiClient";

export default function ProductFormClient({ editId }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    mrp: "",
    discountPercent: "",
    images: [],
    sizes: [],
    collection: "",
  });
  const [message, setMessage] = useState("");

  // load if editing
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const { data } = await api.get(`/products/${editId}`);
        setForm((f) => ({ ...f, ...data }));
      } catch (e) {
        setMessage(e?.response?.data?.message || "Failed to load product");
      }
    })();
  }, [editId]);

  const handleUpload = async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    const { data } = await api.post("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // backend returns { imageUrl: "/uploads/xxx.jpg" }
    return data.imageUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/products/${editId}`, form);
        setMessage("Updated successfully!");
      } else {
        await api.post(`/products`, form);
        setMessage("Created successfully!");
      }
      setTimeout(() => router.push("/admin/products"), 700);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Error");
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">
        {editId ? "Edit" : "Add"} Product
      </h1>

      {message && <p className="mb-4 text-green-600">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* your inputs … */}
        <label className="block">
          <span className="font-medium">Upload image</span>
          <input
            type="file"
            accept="image/*"
            className="block mt-1"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const url = await handleUpload(file);
              setForm((p) => ({ ...p, images: [...(p.images || []), url] }));
            }}
          />
        </label>

        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          {editId ? "Update" : "Create"}
        </button>
      </form>
    </div>
  );
}
