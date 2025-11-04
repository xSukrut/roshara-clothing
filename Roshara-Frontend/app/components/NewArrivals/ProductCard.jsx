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
    const u = new URL(src, API_BASE);

    if (["localhost", "127.0.0.1"].includes(u.hostname)) {
      return API_BASE + u.pathname;
    }

    if (u.pathname.startsWith("/uploads")) {
      return API_BASE + u.pathname;
    }

    return u.href;
  } catch {
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
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);

  // custom measurements state
  const [customBust, setCustomBust] = useState("");
  const [customWaist, setCustomWaist] = useState("");
  const [customHips, setCustomHips] = useState("");
  const [customShoulder, setCustomShoulder] = useState("");
  const [customError, setCustomError] = useState("");

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
      setShowCustomForm(false);
      setCustomBust("");
      setCustomWaist("");
      setCustomHips("");
      setCustomShoulder("");
      setCustomError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuickAdd, product?._id]);

  const heightClass = size === "lg" ? "h-[420px] md:h-[460px]" : "h-[350px]";
  const fav = inWishlist(product._id);

  const firstImage = images[0] || "/placeholder.png";

  function handleAddClick(e) {
    e.preventDefault();
    e.stopPropagation();

    // If custom form is visible, validate measurements
    let customSize = null;
    if (showCustomForm) {
      // basic validation: at least one value or require all?
      if (!customBust || !customWaist || !customHips || !customShoulder) {
        setCustomError("Please fill all measurements (in inches).");
        return;
      }
      // primitive numeric check
      const toNum = (v) => Number(String(v).replace(/[^0-9.]/g, ""));
      if (
        isNaN(toNum(customBust)) ||
        isNaN(toNum(customWaist)) ||
        isNaN(toNum(customHips)) ||
        isNaN(toNum(customShoulder))
      ) {
        setCustomError("Measurements must be numbers.");
        return;
      }

      customSize = {
        bust: String(customBust).trim(),
        waist: String(customWaist).trim(),
        hips: String(customHips).trim(),
        shoulder: String(customShoulder).trim(),
      };
    }

    // final payload: include size and optional customSize
    const payload = {
      product: product._id,
      name: product.name,
      price: product.price,
      image: firstImage,
      size: selectedSize,
    };

    if (customSize) payload.customSize = customSize;

    addItem(payload);
    openMiniCart?.();
    setShowQuickAdd(false);
  }

  return (
    <Link
      href={`/products/${product._id}`}
      className="group relative cursor-pointer block"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false);
      }}
      aria-label={`Open ${product.name}`}
    >
      <motion.div
        className={`relative w-full ${heightClass} overflow-hidden rounded-2xl shadow-sm`}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
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
              e.stopPropagation();
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
                image: firstImage,
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
          className="absolute top-0 right-0 w-64 bg-white shadow-xl rounded p-4 z-50"
          onClick={(e) => {
            // Ensure clicks inside the quick add don't navigate
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="relative w-full h-28 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={firstImage}
              alt={product.name}
              className="w-full h-full object-cover rounded"
              onError={(e) => (e.currentTarget.src = "/placeholder.png")}
            />
            <div className="absolute inset-0 bg-blue-200/30 rounded" />
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Select Size</p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCustomForm((s) => !s);
                }}
                className="text-sm px-2 py-1 border rounded text-gray-700"
                title="Enter custom measurements"
              >
                Custom
              </button>
            </div>

            <div className="flex gap-2 flex-wrap mb-2">
              {sizeOptions.map((s) => (
                <button
                  key={s}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedSize(s);
                    setShowCustomForm(false);
                    setCustomError("");
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

            {/* Custom form */}
            {showCustomForm && (
              <div className="space-y-2">
                <p className="text-xs text-gray-600">Enter measurements (in inches)</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Bust"
                    value={customBust}
                    onChange={(e) => setCustomBust(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Waist"
                    value={customWaist}
                    onChange={(e) => setCustomWaist(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Hips"
                    value={customHips}
                    onChange={(e) => setCustomHips(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Shoulder"
                    value={customShoulder}
                    onChange={(e) => setCustomShoulder(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                </div>
                {customError && <div className="text-red-600 text-xs">{customError}</div>}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddClick}
              className="flex-1 bg-black text-white py-2 rounded"
            >
              Add
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowQuickAdd(false);
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
