"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@services/productService";

/** Build a safe, absolute URL for images.
 *  - Accepts strings or simple objects with .url/.src/.path
 *  - If it starts with http(s), return as-is
 *  - Else prefix with API origin (NEXT_PUBLIC_API_URL without trailing /api)
 */
const API_ORIGIN =
  (process.env.NEXT_PUBLIC_API_URL || "https://roshara-clothing.onrender.com/api")
    .replace(/\/+$/, "")
    .replace(/\/api$/, "");

const pickPath = (src) => {
  if (!src) return null;
  if (typeof src === "string") return src;
  return src.url || src.src || src.path || src.location || src.file || null;
};

const urlFor = (src) => {
  const p = pickPath(src);
  if (!p) return "/placeholder.png";
  if (/^https?:\/\//i.test(p)) return p; // already absolute
  const path = p.startsWith("/") ? p : `/${p}`;
  return `${API_ORIGIN}${path}`;
};

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    removeItem,
    setQty,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    addItem,
    openMiniCart,
  } = useCart();

  const [recommendations, setRecommendations] = useState([]);
  const [recError, setRecError] = useState("");

  const cartIds = useMemo(
    () =>
      new Set(
        (items || [])
          .map((it) => it?.product || it?._id || it?.id)
          .filter(Boolean)
      ),
    [items]
  );

  // Fetch recommendations (exclude already-in-cart items)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setRecError("");
        const all = await getAllProducts();
        const list = Array.isArray(all) ? all : [];
        const filtered = list.filter((p) => !cartIds.has(p._id));
        const top = filtered.slice(0, 4);
        if (!ignore) setRecommendations(top);
      } catch {
        if (!ignore) setRecError("Could not load recommendations.");
      }
    })();
    return () => {
      ignore = true;
    };
  }, [cartIds]);

  const handleCheckout = () => {
    if (!items || items.length === 0) return;
    router.push("/checkout");
  };

  const addRecToCart = (p) => {
    const firstImage =
      (Array.isArray(p.images) && p.images.length ? p.images[0] : null) ||
      p.image ||
      "/placeholder.png";

    addItem({
      product: p._id,
      name: p.name,
      price: p.price,
      image: urlFor(firstImage),
    });
    if (typeof openMiniCart === "function") openMiniCart();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
      {/* Left — Bag Items */}
      <section className="md:col-span-2">
        <h1 className="text-3xl font-bold mb-6 text-[#44120F] tracking-tight">
          Your Bag
        </h1>

        {items.length === 0 ? (
          <p className="text-gray-600 text-lg">Your bag is empty.</p>
        ) : (
          <div className="space-y-5">
            {items.map((it) => {
              const img = urlFor(it.image);
              return (
                <div
                  key={`${it.product}-${it.size || "NOSIZE"}`}
                  className="relative flex flex-col sm:flex-row items-center justify-between gap-4 border border-amber-100 bg-[#FFFDF9] rounded-2xl p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)]   hover:bg-[#e6e4e0] group"
                >
                  {/* Remove */}
                  <button
                    onClick={() => removeItem(it.product, it.size)}
                    className="absolute top-2 right-3 text-gray-400 hover:text-red-800  text-lg transition-all duration-200"
                  >
                    ✕
                  </button>

                  {/* Image & Details */}
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden shadow-sm transition-all duration-500 ease-in-out">
                      <Image
                        src={img}
                        alt={it.name}
                        fill
                        sizes="112px"
                        className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-2xl  text-gray-900">
                        {it.name}
                      </div>
                      {it.size && (
                        <div className="text-md text-gray-600 mt-0.2 mb-10">
                          Size: <span className="font-medium">{it.size}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity + Price */}
                  <div className="flex items-center  gap-35">
                    <div className="flex items-center bg-white border border-gray-300 rounded-3xl shadow-sm overflow-hidden">
                      <button
                        onClick={() =>
                          setQty(it.product, it.size, Math.max(it.qty - 1, 1))
                        }
                        className="px-3 py-1 hover:bg-gray-100 transition-all duration-200"
                      >
                        −
                      </button>
                      <span className="px-4 font-medium text-gray-800">
                        {it.qty}
                      </span>
                      <button
                        onClick={() => setQty(it.product, it.size, it.qty + 1)}
                        className="px-3 py-1 hover:bg-gray-100 transition-all duration-200"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-lg text-amber-900 pr-20 font-semibold">
                      ₹{it.price}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Right — Summary */}
      <aside className="border border-amber-100 rounded-2xl p-6 h-fit shadow-[0_2px_12px_rgba(0,0,0,0.08)] bg-linear-to-br from-white via-[#fffdfa] to-[#fef8f2] transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] hover:-translate-y-1">
        <h2 className="text-2xl font-bold mb-6 text-[#44120F] text-center">
          Order Summary
        </h2>

        <div className="space-y-3 text-gray-700">
          <div className="flex justify-between">
            <span className="font-medium">Subtotal</span>
            <span className="font-semibold">₹{itemsPrice}</span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Shipping</span>
            <span className="font-semibold">
              {shippingPrice ? `₹${shippingPrice}` : "FREE"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="font-medium">Tax</span>
            <span className="font-semibold">₹{taxPrice}</span>
          </div>
        </div>

        <hr className="my-4 border-gray-200" />

        <div className="flex justify-between items-center font-semibold text-xl text-gray-900 mb-5">
          <span>Total</span>
          <span className="text-amber-700">₹{totalPrice}</span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={!items || items.length === 0}
          className="w-full bg-black text-white py-3 rounded-xl font-medium tracking-wide transition-all duration-300 hover:bg-gray-900 hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proceed to Checkout
        </button>

        <Link
          href="/shop"
          className="block w-full text-center mt-4 py-2.5 border border-gray-800 text-gray-900 rounded-xl font-medium transition-all duration-300 hover:bg-gray-900 hover:text-white active:scale-[0.98]"
        >
          Continue Shopping
        </Link>
      </aside>

      {/* Recommendations */}
      <div className="md:col-span-3 max-w-6xl mx-auto mt-12 p-6 bg-linear-to-b from-white to-[#FFFDF9] rounded-2xl shadow-sm">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-[#44120F] text-center">
          You might also like
        </h2>

        {recommendations && recommendations.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {recommendations.map((p) => {
              const first = p.images?.[0] || p.image || "/placeholder.png";
              return (
                <div
                  key={p._id}
                  className="group border border-gray-100 rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] hover:-translate-y-1"
                >
                  <div className="relative w-full h-48 sm:h-56 overflow-hidden rounded-t-2xl">
                    <Image
                      src={urlFor(first)}
                      alt={p.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                    />
                  </div>

                  <div className="p-4 text-center">
                    <div className="text-lg font-semibold text-gray-900 truncate">
                      {p.name}
                    </div>
                    <div className="text-sm text-amber-700 mt-1 font-medium">
                      ₹{p.price}
                    </div>

                    <button
                      onClick={() => addRecToCart(p)}
                      className="mt-3 w-full bg-[#44120F] text-white py-2.5 rounded-lg font-medium text-sm transition-all duration-200 hover:bg-gray-800 hover:scale-[1.02] active:scale-95"
                    >
                      Add to Bag
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            {recError || "No recommendations available."}
          </p>
        )}

        <div className="flex justify-center mt-10">
          <Link
            href="/shop"
            className="inline-block bg-linear-to-r from-black to-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
