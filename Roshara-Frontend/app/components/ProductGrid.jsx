
"use client";
import Link from "next/link";
import ProductCard from "../components/NewArrivals/ProductCard";

export default function ProductGrid({ products = [] }) {
  if (!products || products.length === 0) {
    return <div className="p-6">No products found.</div>;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {products.map((p) => (
        <Link key={p._id} href={`/products/${p._id}`} className="block">
          <ProductCard product={p} />
        </Link>
      ))}
    </div>
  );
}

