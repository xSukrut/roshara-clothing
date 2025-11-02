"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAllProducts } from "@services/productService";
import { getCollection } from "@services/collectionService";
import ProductCard from "@components/NewArrivals/ProductCard";
import ProductDetails from "@components/NewArrivals/ProductDetails";

export default function CollectionProductsPage() {
  const { id } = useParams() || {};
  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!id) return;

    getCollection(id)
      .then(setCollection)
      .catch((e) => console.error("Failed to load collection:", e));

    getAllProducts()
      .then((all = []) => {
        const filtered = all.filter(
          (p) => p?.collection?._id === id || p?.collection === id
        );
        setProducts(filtered);
      })
      .catch((e) => console.error("Failed to load products:", e));
  }, [id]);

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* Title + description */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#2a1b1b]">
          {collection?.name || "Collection"}
        </h1>
        {collection?.description && (
          <p className="text-gray-600 mt-2 max-w-3xl">{collection.description}</p>
        )}
      </header>

      {/* Grid of products */}
      {products.length === 0 ? (
        <p className="text-gray-500">No products in this collection yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
          {products.map((p) => (
            <ProductCard
              key={p._id}
              product={p}
              onSearch={setSelected}
              size="lg"
            />
          ))}
        </div>
      )}

      {/* Quick view */}
      {selected && (
        <ProductDetails product={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}
