"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/apiClient";

// Build absolute URL for uploaded images
const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const asImg = (src) => {
  if (!src) return "/placeholder.png";
  if (/^https?:\/\//i.test(src)) return src;          // absolute (Cloudinary, etc.)
  const path = src.startsWith("/") ? src : `/${src}`;
  // if it's a local uploads path, prefix with backend base
  if (path.startsWith("/uploads")) return `${API_BASE}${path}`;
  return `${API_BASE}${path}`;
};

export default function CollectionForm() {
  const router = useRouter();

  // ---- get ?id=... WITHOUT useSearchParams() (avoids Suspense requirement) ----
  const [id, setId] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const qid = sp.get("id");
    setId(qid);
  }, []);

  const [form, setForm] = useState({ name: "", description: "", image: "" });
  const [message, setMessage] = useState("");

  // Load existing collection if editing
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      try {
        const res = await api.get(`/collections/${id}`);
        if (alive) setForm({
          name: res.data?.name || "",
          description: res.data?.description || "",
          image: res.data?.image || res.data?.imageUrl || "",
        });
      } catch (e) {
        console.error("Failed to load collection", e);
        if (alive) setMessage(e?.response?.data?.message || "Failed to load collection");
      }
    })();
    return () => { alive = false; };
  }, [id]);

  // Upload to /api/upload (field name MUST be "file" per your backend)
  const handleUpload = async (file) => {
    const fd = new FormData();
    fd.append("file", file); // <- important: backend expects "file"
    const res = await api.post("/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // backend returns { url: <secure_url>, public_id, ... } OR { imageUrl: "/uploads/..." }
    return res.data.url || res.data.imageUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
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
      console.error(err);
      setMessage(err?.response?.data?.message || "Error");
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold mb-4">{id ? "Edit" : "Add"} Collection</h1>
      {message && <p className={`mb-4 ${/successfully/i.test(message) ? "text-green-600" : "text-red-600"}`}>{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
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
                setMessage("Image upload failed");
              }
            }}
            className="w-full p-2 border rounded mb-3"
          />

          {form.image && (
            <img
              src={asImg(form.image)}
              alt="preview"
              className="w-32 h-32 object-cover border rounded"
            />
          )}
        </div>

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
          rows={4}
        />

        <button type="submit" className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
          {id ? "Update" : "Create"}
        </button>
      </form>
    </div>
  );
}
