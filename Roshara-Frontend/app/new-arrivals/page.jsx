// app/new-arrivals/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllProducts } from "../../services/productService";
import ProductCard from "../components/ProductCard";
import ProductDetails from "../components/ProductDetails";

export default function NewArrivalsPage() {
  const [all, setAll] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
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
      <p className="text-center text-gray-600 mb-8">Explore the latest additions to our collection</p>

      {loading ? (
        <GridSkeleton size={cardSize} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {newest.map((p) => (
            <ProductCard key={p._id} product={p} onSearch={setSelected} size={cardSize} />
          ))}
        </div>
      )}

      {selected && <ProductDetails product={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}

function GridSkeleton({ size = "lg" }) {
  const h = size === "lg" ? "h-[420px] md:h-[460px]" : "h-[300px]";
  const cells = Array.from({ length: 8 });
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
