"use client";
import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
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
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(
      `${API_BASE_URL}/products`,
      {
        ...form,
        images: form.images.split(",").map((img) => img.trim()),
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    router.push("/admin/products");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Add New Product</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        {["name", "description", "price", "stock", "collection"].map((field) => (
          <input
            key={field}
            type="text"
            placeholder={field}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className="w-full border p-2 rounded"
            required
          />
        ))}
        <input
          type="text"
          placeholder="Image URLs (comma separated)"
          value={form.images}
          onChange={(e) => setForm({ ...form, images: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          Save Product
        </button>
      </form>
    </div>
  );
}
