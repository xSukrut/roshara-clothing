// app/page.jsx
"use client";

import HeroSection from "./components/home/HeroSection";
import NewArrivals from "./components/NewArrivals/NewArrivals";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllCollections } from "../services/collectionService";
import CollectionCard from "./components/CollectionCard";

export default function Homepage() {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    getAllCollections()
      .then((data) =>
        setCollections(Array.isArray(data) ? data.slice(0, 3) : [])
      )
      .catch(() => setCollections([]));
  }, []);

  return (
    <main>
      <HeroSection />
      <NewArrivals />

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Our Collections</h2>
          <Link
            href="/collections"
            className="bg-black text-white px-5 py-2 rounded hover:bg-gray-800 transition"
          >
            View All
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {collections.length > 0 ? (
            collections.map((c) => (
              <CollectionCard key={c._id} collection={c} />
            ))
          ) : (
            <p className="text-gray-500">No collections available yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
