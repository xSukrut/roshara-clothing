"use client";

import { useEffect, useState } from "react";
import api from "../../lib/apiClient";
import CollectionCard from "./CollectionCard";

/**
 * Helper: derive timestamp for sorting.
 * Prefer createdAt, otherwise use objectId timestamp fallback.
 */
function tsFor(item) {
  if (!item) return 0;
  if (item.createdAt) {
    const t = Date.parse(item.createdAt);
    if (!Number.isNaN(t)) return t;
  }
  // fallback: ObjectId -> first 8 hex chars are timestamp (seconds)
  try {
    if (item._id && typeof item._id === "string" && item._id.length >= 8) {
      return parseInt(item._id.slice(0, 8), 16) * 1000;
    }
  } catch {}
  return 0;
}

export default function AllCollectionsSection({ max = 3 }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/collections");
        if (!mounted) return;
        const arr = Array.isArray(res.data) ? res.data : [];

        // sort by createdAt desc (newest first)
        arr.sort((a, b) => tsFor(b) - tsFor(a));

        // only keep top `max`
        setCollections(arr.slice(0, max));
      } catch (err) {
        console.error("Failed to load collections:", err?.response?.data || err.message || err);
        if (mounted) setCollections([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [max]);

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2a1b1b]">Shop by Collections</h2>
          <p className="text-gray-600 mt-2 max-w-xl">
            Explore our curation of styles—designed to celebrate comfort, craft, and individuality.
          </p>
        </div>
        <div>
          <a
            href="/collections"
            className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            aria-label="View all collections"
          >
            View All
          </a>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {Array.from({ length: max }).map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <p className="text-gray-500">No collections available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {collections.map((c) => (
            <CollectionCard key={c._id} collection={c} />
          ))}
        </div>
      )}
    </section>
  );
}
