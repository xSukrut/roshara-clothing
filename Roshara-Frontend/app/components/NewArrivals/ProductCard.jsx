// app/components/NewArrivals/ProductCard.jsx
"use client";

import { motion } from "framer-motion";
import { Search, ShoppingCart, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "../../../context/CartContext";
import { useWishlist } from "../../../context/WishlistContext";
import { ROSHARA_SIZES } from "../../constants/sizes";

// Public API origin, e.g. "https://roshara-clothing.onrender.com"
const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")
    .replace(/\/$/, "")
    .replace(/\/api$/, "");

// Normalize ANY image-ish string to a usable, public URL
function urlFor(src) {
  if (!src) return "/placeholder.png";

  try {
    // If it's absolute, parse it. If it's relative, resolve against API_BASE.
    const u = new URL(src, API_BASE);

    // If it’s pointing at localhost/127, force our public origin
    if (["localhost", "127.0.0.1"].includes(u.hostname)) {
      return API_BASE + u.pathname;
    }

    // If it’s a backend upload path, also force our public origin
    if (u.pathname.startsWith("/uploads")) {
      return API_BASE + u.pathname;
    }

    // Otherwise (cloudinary, CDN, etc), keep as is
    return u.href;
  } catch {
    // Handle weird strings like "uploads/foo.jpg"
    const path = src.startsWith("/") ? src : `/${src}`;
    if (path.startsWith("/uploads")) return API_BASE + path;
    return "/placeholder.png";
  }
}

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

  // Custom size mode + inputs
  const [customMode, setCustomMode] = useState(false);
  const [customSizes, setCustomSizes] = useState({
    bust: "",
    waist: "",
    hips: "",
    shoulder: "",
  });

  // Build image list from product payload
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

  // Fallback to product.image or placeholder
  if (images.length === 0) {
    images = [urlFor(product?.image) || "/placeholder.png"];
  }

  // Cycle on hover
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
      setCustomMode(false);
      setCustomSizes({ bust: "", waist: "", hips: "", shoulder: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuickAdd, product?._id]);

  const heightClass = size === "lg" ? "h-[420px] md:h-[460px]" : "h-[350px]";
  const fav = inWishlist(product._id);

  // helper to update custom input
  const setCustomField = (field, value) =>
    setCustomSizes((p) => ({ ...p, [field]: value }));

  // validate custom sizes: simple numeric > 0
  const validateCustomSizes = () => {
    const { bust, waist, hips, shoulder } = customSizes;
    const vals = [bust, waist, hips, shoulder];
    return vals.every((v) => v !== "" && !isNaN(Number(v)) && Number(v) > 0);
  };

  const handleAdd = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    // if custom mode -> require valid custom inputs
    if (customMode) {
      if (!validateCustomSizes()) {
        // a simple UI cue — could replace with toast
        alert("Please enter valid measurements for all custom fields (in inches).");
        return;
      }
      addItem({
        product: product._id,
        name: product.name,
        price: product.price,
        image: images[0],
        size: "Custom",
        customSize: {
          bust: String(customSizes.bust).trim(),
          waist: String(customSizes.waist).trim(),
          hips: String(customSizes.hips).trim(),
          shoulder: String(customSizes.shoulder).trim(),
        },
      });
      openMiniCart?.();
      setShowQuickAdd(false);
      return;
    }

    // normal size path
    if (!selectedSize) {
      alert("Please select a size.");
      return;
    }
    addItem({
      product: product._id,
      name: product.name,
      price: product.price,
      image: images[0],
      size: selectedSize,
    });
    openMiniCart?.();
    setShowQuickAdd(false);
  };

  return (
    <Link
      href={`/products/${product._id}`}
      className="group relative cursor-pointer block"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false);
        // optionally keep quick add open until user closes it
        // setShowQuickAdd(false);
      }}
      aria-label={`Open ${product.name}`}
    >
      <motion.div
        className={`relative w-full ${heightClass} overflow-hidden rounded-2xl shadow-sm`}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {/* Use plain <img> to avoid next/image host restrictions */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[currentImage]}
          alt={product?.name || "Product"}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.png";
          }}
        />

        {/* hover icons */}
        <div className="absolute top-5 right-3 flex flex-col items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation(); // IMPORTANT: prevent Link navigation
              onSearch?.(product);
            }}
            className="bg-white p-2 rounded-full shadow hover:scale-110 transition-transform"
            aria-label="Quick view"
            title="Quick view"
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
            title="Quick add"
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
        <div
          className="absolute top-0 right-0 w-72 bg-white shadow-xl rounded p-4 z-50"
          onClick={(e) => {
            // Ensure clicks inside the quick add don't navigate
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="relative w-full h-28 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]}
              alt={product.name}
              className="w-full h-full object-cover rounded"
              onError={(e) => (e.currentTarget.src = "/placeholder.png")}
            />
            <div className="absolute inset-0 bg-blue-200/10 rounded" />
          </div>

          <div className="mb-3">
            <p className="text-sm font-semibold mb-2 flex items-center justify-between">
              <span>Select Size</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCustomMode((v) => !v);
                }}
                className={`text-sm px-2 py-1 rounded border ${
                  customMode ? "bg-black text-white border-black" : "bg-white"
                }`}
                title="Custom measurements"
              >
                {customMode ? "Standard" : "Custom"}
              </button>
            </p>

            {!customMode ? (
              <div className="flex gap-2 flex-wrap">
                {sizeOptions.map((s) => (
                  <button
                    key={s}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedSize(s);
                    }}
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
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600">Bust (in)</label>
                  <input
                    value={customSizes.bust}
                    onChange={(e) => setCustomField("bust", e.target.value)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="e.g. 34"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Waist (in)</label>
                  <input
                    value={customSizes.waist}
                    onChange={(e) => setCustomField("waist", e.target.value)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="e.g. 26"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Hips (in)</label>
                  <input
                    value={customSizes.hips}
                    onChange={(e) => setCustomField("hips", e.target.value)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="e.g. 36"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Shoulder (in)</label>
                  <input
                    value={customSizes.shoulder}
                    onChange={(e) => setCustomField("shoulder", e.target.value)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    className="w-full border rounded px-2 py-1 text-sm"
                    placeholder="e.g. 14"
                  />
                </div>
                <div className="col-span-2 text-xs text-gray-500">
                  Enter measurements in inches. Example: <em>34</em> or <em>34.5</em>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 bg-black text-white py-2 rounded"
            >
              Add
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowQuickAdd(false);
                setCustomMode(false);
                setCustomSizes({ bust: "", waist: "", hips: "", shoulder: "" });
              }}
              className="flex-1 border border-gray-400 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Link>
  );
}
