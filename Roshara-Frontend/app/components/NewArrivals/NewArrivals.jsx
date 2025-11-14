"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getAllProducts } from "../../../services/productService";
import ProductCard from "../ProductCard";
import ProductDetails from "../ProductDetails";

export default function NewArrivals() {
  const [all, setAll] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // responsive card size
  const [cardSize, setCardSize] = useState("lg");

  useEffect(() => {
    getAllProducts()
      .then((data) => (Array.isArray(data) ? setAll(data) : setAll([])))
      .catch(() => setAll([]));
  }, []);

  // responsive logic (match other pages)
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

  // newest first, then take 4 (you had 4 in your example)
  const latestFour = useMemo(() => {
    const copy = [...all];
    copy.sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    return copy.slice(0, 4);
  }, [all]);

  return (
    <section className="w-full flex justify-center bg-[#F8F5F0]">
      <div className="max-w-7xl w-full p-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl md:text-4xl font-bold text-[#4A1718]">
              New Arrivals <br /> That Speak Style
            </h2>
            <p className="text-gray-600 mt-2 max-w-xl">
              From effortless everyday wear to festive statements, styles that
              make you feel beautiful.
            </p>
          </div>
          <div className="flex justify-end sm:justify-center md:justify-end mt-4">
            <a
              href="/new-arrivals"
              className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors duration-200"
              aria-label="View all collections"
            >
              View All
            </a>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {latestFour.map((p) => (
            <ProductCard
              key={p._id}
              product={p}
              onSearch={setSelectedProduct}
              size={cardSize}
            />
          ))}
        </div>

        {selectedProduct && (
          <ProductDetails
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </div>
    </section>
  );
}
