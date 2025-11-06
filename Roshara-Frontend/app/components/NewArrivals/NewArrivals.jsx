"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { getAllProducts } from "../../../services/productService";
import ProductCard from "../NewArrivals/ProductCard";
import ProductDetails from "../NewArrivals/ProductDetails";

export default function NewArrivals() {
  const [all, setAll] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    getAllProducts()
      .then((data) => (Array.isArray(data) ? setAll(data) : setAll([])))
      .catch(() => setAll([]));
  }, []);

  // newest first, then take 5
  const latestFive = useMemo(() => {
    const copy = [...all];
    copy.sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    return copy.slice(0, 4);
  }, [all]);

  return (
    <section className="w-full flex justify-center">
      <div className="max-w-7xl w-full p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          {/* Left Section - Heading */}
          <h2 className="text-[#4A1718] text-4xl font-bold mb-4 md:mb-0">
            New Arrivals <br /> That Speak Style
          </h2>

          {/* Right Section - Subheading + Button */}
          <div className="flex flex-col items-start md:items-end text-end max-w-sm pt-5">
            <p className="text-[#4A1718] text-md font-bold mb-4 md:mb-0 pb-4">
              From effortless everyday wear to festive statements,
              styles that make you feel beautifull.
            </p>
            <Link
              href="/new-arrivals"
              className="bg-black text-white px-5 py-2 rounded hover:bg-gray-800 transition"
            >
              View All
            </Link>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {latestFive.map((p) => (
            <ProductCard
              key={p._id}
              product={p}
              onSearch={setSelectedProduct}
              className="w-full h-auto"
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
