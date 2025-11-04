// app/cart/page.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@context/CartContext";
import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@services/productService";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "https://roshara-clothing.onrender.com/api")
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

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setRecError("");
        const all = await getAllProducts();
        const list = Array.isArray(all) ? all : [];
        const filtered = list.filter((p) => !cartIds.has(p._id));
        const top = filtered.slice(0, 8);
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
    openMiniCart?.();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
      {/* Left — Bag Items */}
      <section className="md:col-span-2">
        <h1 className="text-3xl font-bold mb-6 text-[#44120F] tracking-tight">
          Your Bag
        </h1>

        {!Array.isArray(items) || items.length === 0 ? (
          <p className="text-gray-600 text-lg">Your bag is empty.</p>
        ) : (
          <div className="space-y-4">
            {items.map((it) => {
              // build image URL consistently
              const img = urlFor(it.image);

              // Add customSize JSON into the key so React can distinguish different custom entries
              const customKey = it.customSize ? JSON.stringify(it.customSize) : "";

              return (
                <div
                  key={`${it.product}-${it.size || "NOSIZE"}-${customKey}`}
                  className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-amber-100 bg-white rounded-2xl p-3 sm:p-4 shadow-sm transition-all duration-300 hover:shadow-lg"
                >
                  {/* Remove */}
                  <button
                    onClick={() => removeItem(it.product, it.size)}
                    className="absolute top-2 right-3 text-gray-400 hover:text-red-600 text-lg transition-colors"
                    aria-label="Remove from cart"
                  >
                    ✕
                  </button>

                  {/* Image + meta */}
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-gray-100">
                      <Image
                        src={img}
                        alt={it.name}
                        fill
                        sizes="112px"
                        className="object-cover transition-transform duration-500 ease-in-out hover:scale-110"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold text-lg text-gray-900 leading-tight truncate">
                        {it.name}
                      </div>

                      {/* Show custom measurements if present, else show size */}
                      {it.customSize ? (
                        <div className="text-sm text-gray-700 mt-1">
                          <div className="font-medium">Custom measurements:</div>
                          <div className="mt-1 text-gray-600 text-sm">
                            {it.customSize.bust ? `Bust: ${it.customSize.bust}"` : null}
                            {it.customSize.waist ? `  • Waist: ${it.customSize.waist}"` : null}
                            {it.customSize.hips ? `  • Hips: ${it.customSize.hips}"` : null}
                            {it.customSize.shoulder ? `  • Shoulder: ${it.customSize.shoulder}"` : null}
                          </div>
                        </div>
                      ) : it.size ? (
                        <div className="text-sm text-gray-600 mt-1">
                          Size: <span className="font-medium">{it.size}</span>
                        </div>
                      ) : null}

                      <div className="mt-2 inline-flex items-center gap-2">
                        <span className="text-sm text-gray-500">Qty</span>
                        <div className="flex items-center bg-white border border-gray-300 rounded-full shadow-sm overflow-hidden">
                          <button
                            onClick={() =>
                              setQty(it.product, it.size, Math.max(it.qty - 1, 1))
                            }
                            className="w-8 h-8 grid place-items-center hover:bg-gray-100"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="px-3 font-medium text-gray-800">
                            {it.qty}
                          </span>
                          <button
                            onClick={() => setQty(it.product, it.size, it.qty + 1)}
                            className="w-8 h-8 grid place-items-center hover:bg-gray-100"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="ml-auto sm:ml-0">
                    <div className="text-xl font-semibold text-amber-900">
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
      <aside className="border border-amber-100 rounded-2xl p-6 h-fit shadow-sm bg-gradient-to-br from-white via-[#fffdfa] to-[#fef8f2] transition-all duration-300 hover:shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-[#44120F] text-center">
          Order Summary
        </h2>

        <div className="space-y-3 text-gray-700">
          <Row label="Subtotal" value={`₹${itemsPrice}`} />
          <Row label="Shipping" value={shippingPrice ? `₹${shippingPrice}` : "FREE"} />
          <Row label="Tax" value={`₹${taxPrice}`} />
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
      <div className="md:col-span-3 max-w-6xl mx-auto mt-12 p-6 bg-gradient-to-b from-white to-[#FFFDF9] rounded-2xl shadow-sm">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-6 text-[#44120F] text-center">
          You might also like
        </h2>

        {recommendations?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 md:gap-6">
            {recommendations.map((p) => (
              <RecommendationCard key={p._id} product={p} onAdd={addRecToCart} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            {recError || "No recommendations available."}
          </p>
        )}

        <div className="flex justify-center mt-10">
          <Link
            href="/shop"
            className="inline-block bg-gradient-to-r from-black to-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="font-medium">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function RecommendationCard({ product, onAdd }) {
  // Use urlFor here so Image receives a safe/absolute URL
  const first = product.images?.[0] || product.image || "/placeholder.png";
  const img = urlFor(first);

  return (
    <div className="group border border-gray-100 rounded-2xl bg-white shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="relative w-full aspect-[2/3] overflow-hidden">
        <Image
          src={img}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>

      <div className="p-5 flex flex-col items-center text-center">
        <h3 className="text-lg font-semibold text-gray-900 leading-snug line-clamp-1">
          {product.name}
        </h3>

        <p className="text-base font-semibold text-amber-800 mt-1">
          ₹{product.price}
        </p>

        <button
          onClick={() => onAdd(product)}
          className="mt-4 w-full rounded-lg bg-[#44120F] text-white py-3 text-sm font-medium transition-all duration-200 hover:bg-black hover:shadow-md active:scale-[0.98]"
        >
          Add to Bag
        </button>
      </div>
    </div>
  );
}
