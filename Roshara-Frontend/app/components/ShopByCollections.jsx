// app/components/ShopByCollections.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CollectionCard from "./CollectionCard";
import api from "../../lib/apiClient";

export default function ShopByCollections({ limit = 4 }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/collections");
        if (!alive) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setCollections(list.slice(0, limit));
      } catch (err) {
        console.error("Failed to load collections:", err?.message || err);
        setCollections([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [limit]);

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-[#2a1b1b]">
            Shop by Collection
          </h2>
          <p className="text-gray-600 max-w-xl mt-2">
            Browse our curated collections — click a collection to see its
            products.
          </p>
        </div>

        <div className="hidden sm:block">
          <Link
            href="/collections"
            className="inline-block px-4 py-2 rounded border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 shadow-sm"
          >
            View all collections
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: limit }).map((_, i) => (
            <div
              key={i}
              className="h-56 bg-gray-50 rounded-2xl animate-pulse"
            />
          ))
        ) : collections.length === 0 ? (
          <p className="text-gray-500">No collections yet.</p>
        ) : (
          collections.map((c) => (
            <div key={c._id} className="h-full">
              <CollectionCard collection={c} />
            </div>
          ))
        )}
      </div>

      {/* mobile view: show "View all" under grid */}
      <div className="mt-6 sm:hidden text-center">
        <Link
          href="/collections"
          className="inline-block px-4 py-2 rounded border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 shadow-sm"
        >
          View all collections
        </Link>
      </div>
    </section>
  );
}
