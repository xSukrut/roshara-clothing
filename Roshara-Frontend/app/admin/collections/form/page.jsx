"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "../../../../lib/apiClient";

const asImg = (src) => (src?.startsWith("http") ? src : `http://localhost:5000${src}`);

export default function CollectionForm() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const [form, setForm] = useState({ name: "", description: "", image: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (id) {
      api.get(`/collections/${id}`).then((res) => setForm(res.data));
    }
  }, [id]);

  const handleUpload = async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    const res = await api.post("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.imageUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await api.put(`/collections/${id}`, form);
        setMessage("Updated successfully!");
      } else {
        await api.post(`/collections`, form);
        setMessage("Created successfully!");
      }
      setTimeout(() => router.push("/admin/collections"), 600);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">{id ? "Edit" : "Add"} Collection</h1>
      {message && <p className="mb-4 text-green-600">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block mb-2 font-medium">Upload Collection Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const imageUrl = await handleUpload(file);
              setForm((prev) => ({ ...prev, image: imageUrl }));
            } catch (error) {
              console.error("Upload failed", error);
            }
          }}
          className="w-full p-2 border rounded mb-3"
        />

        {form.image && (
          <img src={asImg(form.image)} alt="preview" className="w-32 h-32 object-cover border rounded" />
        )}

        <input
          type="text"
          placeholder="Collection name"
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
          rows="4"
        />
        <button type="submit" className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
          {id ? "Update" : "Create"}
        </button>
      </form>
    </div>
  );
}
