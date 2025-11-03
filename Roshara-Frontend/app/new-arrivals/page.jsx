"use client";
import { useEffect, useMemo, useState } from "react";
import { getAllProducts } from "@services/productService";
import ProductCard from "@components/NewArrivals/ProductCard";
import ProductDetails from "@components/NewArrivals/ProductDetails";

export default function NewArrivalsPage() {
  const [all, setAll] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getAllProducts()
      .then((data) => (Array.isArray(data) ? setAll(data) : setAll([])))
      .catch(() => setAll([]));
  }, []);

  const newest = useMemo(() => {
    const copy = [...all];
    copy.sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    return copy;
  }, [all]);

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-center mb-2">All New Arrivals</h1>
      <p className="text-center text-gray-600 mb-8">
        Explore the latest additions to our collection
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {newest.map((p) => (
          <ProductCard
            key={p._id}
            product={p}
            onSearch={setSelected}
            size="lg"
          />
        ))}
      </div>

      {selected && (
        <ProductDetails product={selected} onClose={() => setSelected(null)} />
      )}
    </main>
  );
}
