"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/apiClient";
import { resolveImg } from "@/utils/img";

export default function CollectionFormClient({ editId }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    if (!editId) return;

    (async () => {
      try {
        const { data } = await api.get(`/collections/${editId}`);
        if (!alive) return;
        setForm({
          name: data?.name || "",
          description: data?.description || "",
          image: data?.image || data?.imageUrl || "",
        });
      } catch (e) {
        if (!alive) return;
        setMessage(e?.response?.data?.message || "Failed to load collection");
      }
    })();

    return () => { alive = false; };
  }, [editId]);

  const handleUpload = async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    fd.append("file", file);
    const { data } = await api.post("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data?.imageUrl || data?.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (editId) {
        await api.put(`/collections/${editId}`, form);
        setMessage("Updated successfully!");
      } else {
        await api.post(`/collections`, form);
        setMessage("Created successfully!");
      }
      setTimeout(() => router.push("/admin/collections"), 600);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Error");
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">
        {editId ? "Edit" : "Add"} Collection
      </h1>

      {message && (
        <p className={`mb-4 ${/success/i.test(message) ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 font-medium">Upload Collection Image</label>
          <input
            type="file"
            accept="image/*"
            className="w-full p-2 border rounded mb-3"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const url = await handleUpload(file);
                setForm((prev) => ({ ...prev, image: url }));
              } catch {
                setMessage("Image upload failed");
              }
            }}
          />

          {form.image && (
            <img
              src={resolveImg(form.image)}
              alt="Collection preview"
              className="w-32 h-32 object-cover border rounded"
            />
          )}
        </div>

        <input
          type="text"
          placeholder="Collection name"
          className="w-full p-2 border rounded"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
        />

        <textarea
          placeholder="Description"
          className="w-full p-2 border rounded"
          rows={4}
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />

        <button type="submit" className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
          {editId ? "Update" : "Create"}
        </button>
      </form>
    </div>
  );
}
