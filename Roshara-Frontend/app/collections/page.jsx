"use client";

import { useEffect, useState } from "react";
import CollectionCard from "../components/CollectionCard";
import { getAllCollections } from "@services/collectionService";

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
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#2a1b1b]">
          Collections
        </h1>

        <p className="text-gray-600 max-w-xl leading-relaxed">
          Explore our curation of styles—designed to celebrate comfort, craft,
          and individuality.
        </p>
      </div>

      {/* Grid - items-stretch and gap ensure consistent card heights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
        {collections.map((c) => (
          <div key={c._id} className="h-full">
            <CollectionCard collection={c} />
          </div>
        ))}
      </div>

      {collections.length === 0 && (
        <p className="text-gray-500 mt-8">No collections yet.</p>
      )}
    </main>
  );
}
