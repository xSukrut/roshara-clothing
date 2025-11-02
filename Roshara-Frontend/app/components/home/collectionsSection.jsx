"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { getAllCollections } from "@/services/collectionService"; 

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

export default function CollectionsSection() {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    getAllCollections()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        // show top 2 (or change slice to show more)
        setCollections(list.slice(0, 2));
      })
      .catch(() => setCollections([]));
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2a1b1b]">
            Our Collections
          </h2>
        </div>
        <Link
          href="/collections"
          className="mt-4 md:mt-0 bg-black text-white px-5 py-2 rounded-md hover:bg-gray-800 transition"
        >
          View All
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
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
                className="w-full h-[350px] md:h-[380px] object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
                priority={false}
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/45 flex flex-col justify-center items-center text-center text-white px-6 transition-all duration-300 group-hover:bg-black/55">
                <h3 className="text-2xl font-semibold mb-2">
                  {c.name || "Collection"}
                </h3>
                {c.description ? (
                  <p className="text-sm md:text-base opacity-90 leading-relaxed line-clamp-3">
                    {c.description}
                  </p>
                ) : null}

                <Link
                  href={`/collections/${c._id}`}
                  className="mt-4 inline-block bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition"
                >
                  Explore →
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
