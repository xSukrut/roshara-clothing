"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { getAllCollections } from "@services/collectionService";

/* --- same image helpers --- */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ||
  "http://localhost:5000";

const pickPath = (src) => {
  if (!src) return null;
  if (typeof src === "string") return src;
  return src.url || src.src || src.path || src.location || src.file || null;
};

const urlFor = (src) => {
  const p = pickPath(src);
  if (!p) return "/placeholder.png";
  if (p.startsWith("http")) return p;
  const path = p.startsWith("/") ? p : `/${p}`;
  if (path.startsWith("/uploads")) return `${API_BASE}${path}`;
  return `${API_BASE}${path}`;
};

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    getAllCollections()
      .then((data) => setCollections(Array.isArray(data) ? data : []))
      .catch(() => setCollections([]));
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* Header row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#2a1b1b]">
          Collections
        </h1>
        <p className="text-gray-600 max-w-xl mt-2 md:mt-0">
          Explore our curation of styles—designed to celebrate comfort, craft,
          and individuality.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {collections.map((c) => {
          const imgSrc = urlFor(c.image || c.cover || c.imageUrl);

          return (
            <motion.div
              key={c._id}
              className="relative overflow-hidden rounded-2xl shadow-md group"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.25 }}
            >
              <Image
                src={imgSrc}
                alt={c.name || "Collection"}
                width={1000}
                height={700}
                className="w-full h-320px object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
              />

              {/* Content overlay */}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300 flex items-end rounded-2xl">
                <div className="w-full p-5 text-white">
                  <h3 className="text-xl font-semibold">{c.name}</h3>
                  {c.description ? (
                    <p className="text-sm opacity-90 line-clamp-2 mt-1">
                      {c.description}
                    </p>
                  ) : null}
                  <Link
                    href={`/collections/${c._id}`}
                    className="mt-3 inline-block bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition"
                  >
                    View Collection
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {collections.length === 0 && (
        <p className="text-gray-500 mt-8">No collections yet.</p>
      )}
    </main>
  );
}
