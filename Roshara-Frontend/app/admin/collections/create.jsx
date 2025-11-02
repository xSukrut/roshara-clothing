"use client";
import { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@utils/api";
import { useAuth } from "@context/AuthContext";
import { useRouter } from "next/navigation";

export default function CreateCollectionPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", description: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(`${API_BASE_URL}/collections`, form, {
      headers: { Authorization: `Bearer ${token}` },
    });
    router.push("/admin/collections");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Add New Collection</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
        {["name", "description"].map((field) => (
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
        <button type="submit" className="bg-black text-white px-4 py-2 rounded">
          Save Collection
        </button>
      </form>
    </div>
  );
}
