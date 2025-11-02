"use client";

import Link from "next/link";
import Image from "next/image";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

// Build a safe, absolute URL for images
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") || "http://localhost:5000";

/**
 * Accepts lots of shapes:
 *  - full http(s) URL
 *  - "/uploads/..." from backend
 *  - "/..." (public asset)
 *  - falsy -> placeholder
 */
function urlFor(src) {
  if (!src || typeof src !== "string") return "/placeholder.png";
  if (src.startsWith("http")) return src;
  if (src.startsWith("/uploads")) return `${API_BASE}${src}`;
  if (src.startsWith("/")) return src;
  // last resort, assume backend uploads without leading slash
  return `${API_BASE}/uploads/${src}`;
}

// A stable key from item
const keyFor = (it, idx) =>
  it?.product || it?._id || it?.id || `${it?.name || "item"}-${idx}`;

export default function WishlistPage() {
  const { items = [], remove, clear } = useWishlist();
  const { addItem, openMiniCart } = useCart();

  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl text-center font-bold text-[#461518] mb-12">
        Your Wishlist
      </h1>

      {safeItems.length === 0 ? (
        <div className="text-center text-gray-600 text-lg">
          Your wishlist is empty.{" "}
          <Link
            href="/shop"
            className="underline text-[#461518] font-semibold hover:text-[#7a1f1f] transition-colors"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <>
          {/* bigger cards + responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {safeItems.map((it, idx) => {
              const src = urlFor(it?.image);
              const name = it?.name || "Product";
              const price = typeof it?.price === "number" ? it.price : Number(it?.price) || 0;

              return (
                <div
                  key={keyFor(it, idx)}
                  className="border border-[#eeeae0] rounded-2xl p-3 bg-white shadow-md hover:shadow-xl transition-shadow duration-300 group"
                >
                  {/* image block */}
                  <div className="relative w-full h-64 overflow-hidden rounded-xl mb-4">
                    <Image
                      src={src}
                      alt={name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      onError={(e) => {
                        // graceful fallback on broken URLs
                        const img = e.currentTarget;
                        img.src = "/placeholder.png";
                      }}
                    />
                  </div>

                  <div className="font-semibold text-lg text-gray-800 mb-1 line-clamp-2">
                    {name}
                  </div>
                  <div className="text-gray-700 mb-4">₹{price.toLocaleString("en-IN")}</div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        addItem(
                          {
                            product: it?.product || it?._id || it?.id,
                            name,
                            price,
                            image: src, // store resolved src for cart
                            qty: 1,
                          },
                          1
                        );
                        openMiniCart?.();
                      }}
                      className="flex-1 bg-[#461518] text-white py-2 rounded-xl hover:bg-[#7a1f1f] transition-colors duration-300"
                    >
                      Add to Bag
                    </button>

                    <button
                      onClick={() => remove(it?.product || it?._id || it?.id)}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center mt-10">
            <button
              onClick={clear}
              className="border border-gray-400 px-6 py-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors duration-300"
            >
              Clear Wishlist
            </button>
          </div>
        </>
      )}
    </div>
  );
}
