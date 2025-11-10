// admin/collections/create.jsx
"use client";

import { useState, useRef } from "react";
import api from "../../../lib/apiClient"; // adjust path per your repo layout
import { useRouter } from "next/navigation";
import { resolveImg } from "../../../utils/img";

export default function CreateCollectionPage() {
  const router = useRouter();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ name: "", description: "", image: "" });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setMessage("");
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await api.post("/upload", fd);
      const url = res?.data?.url || res?.data?.imageUrl;
      if (!url) throw new Error("Upload failed: no URL returned");
      setForm((p) => ({ ...p, image: url }));
    } catch (err) {
      console.error("Upload error:", err?.response || err);
      setMessage(err?.response?.data?.message || err?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/collections", {
        name: form.name,
        description: form.description,
        image: form.image,
      });
      router.push("/admin/collections");
    } catch (err) {
      setMessage(err?.response?.data?.message || err?.message || "Save failed");
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Add New Collection</h1>

      {message && <p className="mb-4 text-red-600">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border p-2 rounded"
          required
        />

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border p-2 rounded"
          rows={4}
        />

        <div>
          <label className="block mb-2 font-medium">Collection image</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              await handleUpload(f);
            }}
            className="w-full p-2 border rounded mb-3"
          />

          {uploading && <div className="text-sm text-gray-500 mb-2">Uploading…</div>}

          {form.image ? (
            <div className="flex items-center gap-3">
              {/* preview */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImg(form.image)}
                alt="cover"
                className="w-28 h-28 object-cover rounded"
              />
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, image: "" }))}
                className="px-3 py-2 border rounded hover:bg-gray-50"
              >
                Remove image
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={uploading}
          >
            Save Collection
          </button>
        </div>
      </form>
    </div>
  );
}
