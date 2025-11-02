"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../../lib/apiClient";

const imgUrl = (src) => {
  if (!src) return "";
  return src.startsWith("http") ? src : `http://localhost:5000${src}`;
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data));
  }, []);

  const handleDelete = async (id) => {
    await api.delete(`/products/${id}`);
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-4">Products</h1>

      <Link
        href="/admin/products/form"
        className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800 mb-4"
      >
        + Add Product
      </Link>

      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Image</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Price</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              <td className="p-2 border text-center">
                {p.images?.[0] ? (
                  <img
                    src={imgUrl(p.images[0])}
                    alt={p.name}
                    className="w-16 h-16 object-cover mx-auto rounded"
                  />
                ) : (
                  <span className="text-gray-400">No image</span>
                )}
              </td>
              <td className="p-2 border">{p.name}</td>
              <td className="p-2 border">₹{p.price}</td>
              <td className="p-2 border">
                <Link
                  href={`/admin/products/form?id=${p._id}`}
                  className="text-blue-600 hover:underline mr-3"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(p._id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td className="p-4 text-center text-gray-500" colSpan={4}>
                No products found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
