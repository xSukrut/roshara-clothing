"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { Search, ShoppingCart, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@context/CartContext";
import { useWishlist } from "@context/WishlistContext";
import { ROSHARA_SIZES } from "@constants/sizes"; 

// Build absolute URL for uploaded images
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ||
  "http://localhost:5000";

const urlFor = (src) => {
  if (!src) return "/placeholder.png";
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  if (src.startsWith("/uploads")) return `${API_BASE}${src}`;
  return src;
};

// Normalize sizes to simple strings
function normalizeSizes(input) {
  const arr = Array.isArray(input) ? input : [];
  const normalized = arr
    .map((s) => (typeof s === "string" ? s : s?.label || s?.value || ""))
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set(normalized)];
}

export default function ProductCard({ product, onSearch, size = "md" }) {
  const { addItem, openMiniCart } = useCart();
  const { inWishlist, toggle } = useWishlist();

  const [hovering, setHovering] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);

  // images
  const rawImages = Array.isArray(product?.images) ? product.images : [];
  let images = rawImages
    .map((img) => {
      const s =
        typeof img === "string"
          ? img
          : img?.url || img?.src || img?.path || img?.location || img?.file;
      return s ? urlFor(s) : null;
    })
    .filter(Boolean);
  if (images.length === 0) images = ["/placeholder.png"];

  // cycle on hover
  useEffect(() => {
    let t;
    if (hovering && images.length > 1) {
      t = setInterval(() => setCurrentImage((p) => (p + 1) % images.length), 600);
    }
    return () => clearInterval(t);
  }, [hovering, images.length]);

  // sizes: prefer product.sizes; else use ROSHARA_SIZES
  const sizeOptions = (() => {
    const norm = normalizeSizes(product?.sizes);
    return norm.length ? norm : ROSHARA_SIZES;
  })();

  // preselect first size when opening panel
  useEffect(() => {
    if (showQuickAdd) {
      setSelectedSize((prev) => prev ?? sizeOptions[0]);
    } else {
      setSelectedSize(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuickAdd, product?._id]);

  const heightClass = size === "lg" ? "h-[420px] md:h-[460px]" : "h-[350px]";
  const fav = inWishlist(product._id);

  return (
    <div
      className="group relative cursor-pointer"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <motion.div
        className={`relative w-full ${heightClass} overflow-hidden rounded-2xl shadow-sm`}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Image
          src={images[currentImage]}
          alt={product.name}
          fill
          className="object-cover transition-all duration-700"
          sizes="(max-width: 768px) 100vw, 33vw"
        />

        {/* hover icons */}
        <div className="absolute top-5 right-3 flex flex-col items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSearch?.(product);
            }}
            className="bg-white p-2 rounded-full shadow hover:scale-110 transition-transform"
            aria-label="Quick view"
          >
            <Search className="w-5 h-5 text-gray-700" />
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowQuickAdd(true);
            }}
            className="bg-white p-2 rounded-full shadow hover:scale-110 transition-transform"
            aria-label="Add to bag"
          >
            <ShoppingCart className="w-5 h-5 text-gray-700" />
          </button>

          <button
            className={`p-2 rounded-full shadow hover:scale-110 transition-transform ${
              fav ? "bg-red-500 text-white" : "bg-white"
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle({
                product: product._id,
                name: product.name,
                price: product.price,
                image: images[0] || "/placeholder.png",
              });
            }}
            aria-label={fav ? "Remove from wishlist" : "Add to wishlist"}
            title={fav ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Info */}
      <div className="text-center mt-3">
        <h3 className="font-semibold text-2xl text-gray-800">{product.name}</h3>
        <p className="text-gray-600 text-lg font-semibold">
          ₹{Number(product.price).toLocaleString("en-IN")}
        </p>
      </div>

      {/* Quick Add */}
      {showQuickAdd && (
        <div className="absolute top-0 right-0 w-56 bg-white shadow-xl rounded p-4 z-50">
          <div className="relative w-full h-32 mb-3">
            <Image
              src={images[0]}
              alt={product.name}
              fill
              className="object-cover rounded"
            />
            <div className="absolute inset-0 bg-blue-200/30 rounded" />
          </div>

          <div className="mb-3">
            <p className="text-sm font-semibold mb-1">Select Size</p>
            <div className="flex gap-2 flex-wrap">
              {sizeOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`border rounded-md py-1 px-2 text-sm transition-all ${
                    selectedSize === s
                      ? "bg-black text-white border-black"
                      : "border-gray-300 text-gray-700 hover:border-black"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!selectedSize) return;
                addItem({
                  product: product._id,
                  name: product.name,
                  price: product.price,
                  image: images[0],
                  size: selectedSize,
                });
                openMiniCart?.();
                setShowQuickAdd(false);
              }}
              className="flex-1 bg-black text-white py-2 rounded"
            >
              Add
            </button>
            <button
              onClick={() => setShowQuickAdd(false)}
              className="flex-1 border border-gray-400 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
