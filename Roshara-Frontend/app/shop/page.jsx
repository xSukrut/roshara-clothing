// app/shop/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import ProductDetails from "../components/ProductDetails";
import { getAllProducts } from "../../services/productService";

export default function ShopAllPage() {
  const [all, setAll] = useState([]);
  const [visible, setVisible] = useState(12);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new");
  const [minP, setMinP] = useState("");
  const [maxP, setMaxP] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // responsive card size state
  const [cardSize, setCardSize] = useState("lg");

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

  useEffect(() => {
    const calc = () => {
      if (typeof window === "undefined") return;
      const w = window.innerWidth;
      setCardSize(w <= 640 ? "md" : "lg");
    };
    calc();
    let t;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(calc, 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const filtered = useMemo(() => {
    let list = [...all];
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      list = list.filter((p) => p.name?.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term));
    }
    const min = Number(minP);
    const max = Number(maxP);
    if (!Number.isNaN(min) && min > 0) list = list.filter((p) => Number(p.price) >= min);
    if (!Number.isNaN(max) && max > 0) list = list.filter((p) => Number(p.price) <= max);
    if (sort === "price-asc") list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sort === "price-desc") list.sort((a, b) => Number(b.price) - Number(a.price));
    else {
      list.sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));
    }
    return list;
  }, [all, q, sort, minP, maxP]);

  const shown = filtered.slice(0, visible);

  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      {/* Page Heading */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#44120F]">Shop All</h1>
        <p className="text-gray-500 mt-2 text-sm md:text-base">{loading ? "Loading products…" : `${filtered.length} item${filtered.length === 1 ? "" : "s"} available`}</p>
        <div className="mt-1 h-2px w-20 mx-auto bg-linear-to-r from-amber-600 to-yellow-400 rounded-full" />
      </div>

      {/* Controls (unchanged) */}
      {/* ... (keep your controls markup here - omitted for brevity in this snippet) */}

      {/* Product Grid */}
      {loading ? (
        <GridSkeleton size={cardSize} />
      ) : shown.length === 0 ? (
        <div className="text-center text-gray-600 py-16">
          <p className="text-lg font-medium">No products match your filters.</p>
          <p className="text-sm text-gray-400 mt-1">Try clearing filters or adjusting your search.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
            {shown.map((p) => (
              <ProductCard key={p._id} product={p} onSearch={setSelectedProduct} size={cardSize} />
            ))}
          </div>

          {shown.length < filtered.length && (
            <div className="text-center mt-10">
              <button onClick={() => setVisible((v) => v + 12)} className="px-8 py-2.5 bg-black text-white rounded-full font-medium text-sm hover:bg-gray-900 transition-all active:scale-[0.98]">Load More</button>
            </div>
          )}
        </>
      )}

      {selectedProduct && <ProductDetails product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </main>
  );
}

function GridSkeleton({ size = "lg" }) {
  const h = size === "lg" ? "h-[420px] md:h-[460px]" : "h-[300px]";
  const cells = Array.from({ length: 8 });
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
      {cells.map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className={`${h} w-full bg-gray-200 rounded-2xl`} />
          <div className="mt-3 h-4 w-2/3 bg-gray-200 rounded" />
          <div className="mt-2 h-4 w-1/3 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}
