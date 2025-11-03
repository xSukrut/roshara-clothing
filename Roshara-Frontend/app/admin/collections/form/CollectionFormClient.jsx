"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/apiClient";
import { resolveImg } from "@/utils/img";

export default function CollectionFormClient({ editId }) {
  const router = useRouter();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "", // cloudinary URL or /uploads/... (resolveImg handles both)
  });

  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  // Load existing collection when editing
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

    return () => {
      alive = false;
    };
  }, [editId]);

  /**
   * Upload image to backend (/api/upload) which forwards to Cloudinary.
   * IMPORTANT: Do NOT set the Content-Type header when sending FormData.
   * The browser adds the proper multipart boundary automatically.
   */
  const handleUpload = async (file) => {
    const fd = new FormData();
    fd.append("image", file); // backend accepts "image"

    setUploading(true);
    setMessage("");
    try {
      const { data } = await api.post("/upload", fd);
      // backend may return { url } (cloudinary) or { imageUrl: "/uploads/..." }
      const url = data?.url || data?.imageUrl;
      if (!url) throw new Error("Upload failed: no URL returned");
      setForm((prev) => ({ ...prev, image: url }));
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Image upload failed";
      setMessage(msg);
      throw err;
    } finally {
      setUploading(false);
      // reset input so the same file can be reselected if needed
      if (fileRef.current) fileRef.current.value = "";
    }
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
        <p
          className={`mb-4 ${
            /success/i.test(message) ? "text-green-600" : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image Uploader */}
        <div>
          <label className="block mb-2 font-medium">Upload Collection Image</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                await handleUpload(file);
              } catch {
                /* message already set in handleUpload */
              }
            }}
            className="w-full p-2 border rounded mb-3 disabled:opacity-50"
          />

          {uploading && (
            <div className="text-sm text-gray-500 mb-2">Uploading…</div>
          )}

          {form.image && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImg(form.image)}
                alt="Collection preview"
                className="w-32 h-32 object-cover border rounded"
              />
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, image: "" }))}
                className="px-3 py-2 border rounded hover:bg-gray-50"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Name */}
        <input
          type="text"
          placeholder="Collection name"
          className="w-full p-2 border rounded"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
        />

        {/* Description */}
        <textarea
          placeholder="Description"
          className="w-full p-2 border rounded"
          rows={4}
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
        />

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
