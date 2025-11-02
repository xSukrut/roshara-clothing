"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@components/NewArrivals/ProductCard";
import ProductDetails from "@components/NewArrivals/ProductDetails";
import { getAllProducts } from "@services/productService";

export default function ShopAllPage() {
  const [all, setAll] = useState([]);
  const [visible, setVisible] = useState(12);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new");
  const [minP, setMinP] = useState("");
  const [maxP, setMaxP] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getAllProducts();
        if (!ignore) setAll(Array.isArray(data) ? data : []);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...all];

    if (q.trim()) {
      const term = q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term)
      );
    }

    const min = Number(minP);
    const max = Number(maxP);
    if (!Number.isNaN(min) && min > 0)
      list = list.filter((p) => Number(p.price) >= min);
    if (!Number.isNaN(max) && max > 0)
      list = list.filter((p) => Number(p.price) <= max);

    if (sort === "price-asc")
      list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "price-desc")
      list.sort((a, b) => Number(b.price) - Number(a.price));
    else {
      list.sort(
        (a, b) =>
          (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
          (a.createdAt ? new Date(a.createdAt).getTime() : 0)
      );
    }
    return list;
  }, [all, q, sort, minP, maxP]);

  const shown = filtered.slice(0, visible);

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* Page Heading */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#44120F]">
          Shop All
        </h1>
        <p className="text-gray-500 mt-2 text-sm md:text-base">
          {loading
            ? "Loading products…"
            : `${filtered.length} item${
                filtered.length === 1 ? "" : "s"
              } available`}
        </p>
        <div className="mt-1 h-2px w-20 mx-auto bg-linear-to-r from-amber-600 to-yellow-400 rounded-full" />
      </div>

      {/* Controls Section */}
      <div className="bg-linear-to-r from-[#faf9f6] via-[#fefcf9] to-[#f9f7f3] border border-amber-100 shadow-sm rounded-2xl px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 transition-all duration-300 hover:shadow-md">
        {/* Search Bar */}
        <div className="relative flex-1 md:max-w-md">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for products…"
            className="w-full border border-gray-300 rounded-full pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent transition-all"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
            />
          </svg>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Price Range */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={minP}
              onChange={(e) => setMinP(e.target.value)}
              placeholder="Min ₹"
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="number"
              min="0"
              value={maxP}
              onChange={(e) => setMaxP(e.target.value)}
              placeholder="Max ₹"
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none border border-gray-200 bg-linear-to-r from-gray-50 to-white rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-600 
               shadow-sm hover:shadow-md transition-all duration-200 ease-in-out 
               focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400"
            >
              <option value="new ">✨ Newest</option>
              <option value="price-asc ">💸 Price: Low → High</option>
              <option value="price-desc">💰 Price: High → Low</option>
            </select>

            {/* Dropdown arrow */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <GridSkeleton />
      ) : shown.length === 0 ? (
        <div className="text-center text-gray-600 py-16">
          <p className="text-lg font-medium">No products match your filters.</p>
          <p className="text-sm text-gray-400 mt-1">
            Try clearing filters or adjusting your search.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
            {shown.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                onSearch={setSelectedProduct}
                size="lg"
              />
            ))}
          </div>

          {shown.length < filtered.length && (
            <div className="text-center mt-10">
              <button
                onClick={() => setVisible((v) => v + 12)}
                className="px-8 py-2.5 bg-black text-white rounded-full font-medium text-sm hover:bg-gray-900 transition-all active:scale-[0.98]"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </main>
  );
}

function GridSkeleton() {
  const cells = Array.from({ length: 8 });
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {cells.map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="w-full h-[420px] md:h-[460px] bg-gray-200 rounded-2xl" />
          <div className="mt-3 h-4 w-2/3 bg-gray-200 rounded" />
          <div className="mt-2 h-4 w-1/3 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}
