"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProductById } from "@/services/productService";
import { useCart } from "@/context/CartContext";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!id) return;
    getProductById(id).then(setProduct).catch(console.error);
  }, [id]);

  if (!product) return <div className="p-6">Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="grid md:grid-cols-2 gap-6">
        <img src={product.images?.[0] || "/images/placeholder.png"} alt={product.name} className="w-full h-96 object-cover" />
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="mt-4">{product.description}</p>
          <p className="mt-4 font-bold">₹{product.price}</p>
          <button onClick={() => addToCart(product, 1)} className="bg-black text-white px-4 py-2 mt-4">Add to cart</button>
        </div>
      </div>
    </div>
  );
}
