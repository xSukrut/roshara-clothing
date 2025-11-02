"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../../lib/apiClient";

const imgUrl = (src) => (src?.startsWith("http") ? src : `http://localhost:5000${src}`);

export default function AdminCollections() {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    api.get("/collections").then((res) => setCollections(res.data));
  }, []);

  const handleDelete = async (id) => {
    await api.delete(`/collections/${id}`);
    setCollections((prev) => prev.filter((c) => c._id !== id));
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-4">Collections</h1>

      <Link
        href="/admin/collections/form"
        className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800 mb-4"
      >
        + Add Collection
      </Link>

      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Image</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Description</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {collections.map((c) => (
            <tr key={c._id}>
              <td className="p-2 border text-center">
                {c.image ? (
                  <img src={imgUrl(c.image)} alt={c.name} className="w-16 h-16 object-cover mx-auto rounded" />
                ) : (
                  <span className="text-gray-400">No image</span>
                )}
              </td>
              <td className="p-2 border">{c.name}</td>
              <td className="p-2 border">{c.description}</td>
              <td className="p-2 border">
                <Link href={`/admin/collections/form?id=${c._id}`} className="text-blue-600 hover:underline mr-3">
                  Edit
                </Link>
                <button onClick={() => handleDelete(c._id)} className="text-red-600 hover:underline">
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {collections.length === 0 && (
            <tr>
              <td className="p-4 text-center text-gray-500" colSpan={4}>
                No collections found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
