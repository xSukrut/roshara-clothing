"use client";

import { motion } from "framer-motion";
import { Search, ShoppingCart, Heart } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { ROSHARA_SIZES } from "../constants/sizes";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
)
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

// surcharge for XL and above
const EXTRA_FOR_LARGE = 200;
function isLargeSize(size) {
  if (!size) return false;
  const s = String(size).toUpperCase().replace(/\s+/g, "");
  if (s === "XL" || s === "XXL") return true;
  const m = s.match(/^(\d+)XL$/);
  if (m && Number(m[1]) >= 2) return true;
  const m2 = s.match(/^(\d+)X$/);
  if (m2 && Number(m2[1]) >= 2) return true;
  return false;
}

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
    const path =
      typeof src === "string" && src.startsWith("/") ? src : `/${src}`;
    if (path.startsWith("/uploads")) return API_BASE + path;
    return "/placeholder.png";
  }
}

function normalizeSizes(input) {
  const arr = Array.isArray(input) ? input : [];
  const normalized = arr
    .map((s) => (typeof s === "string" ? s : s?.label || s?.value || ""))
    .map((s) => (s || "").toString().trim())
    .filter(Boolean);
  return [...new Set(normalized)];
}

export default function ProductCard({ product, onSearch, size = "md" }) {
  const { addItem, openMiniCart } = useCart();
  const { inWishlist, toggle } = useWishlist();

  const [hovering, setHovering] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showCustomInputs, setShowCustomInputs] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);

  // custom measurements
  const [customBust, setCustomBust] = useState("");
  const [customWaist, setCustomWaist] = useState("");
  const [customHips, setCustomHips] = useState("");
  const [customShoulder, setCustomShoulder] = useState("");

  // NEW: lining state
  const [lining, setLining] = useState("without");

  const quickAddRef = useRef(null);
  const wrapperRef = useRef(null);

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

  if (images.length === 0) {
    images = [urlFor(product?.image) || "/placeholder.png"];
  }

  useEffect(() => {
    let t;
    if (hovering && images.length > 1) {
      t = setInterval(
        () => setCurrentImage((p) => (p + 1) % images.length),
        600
      );
    }
    return () => clearInterval(t);
  }, [hovering, images.length]);

  const sizeOptions = (() => {
    const norm = normalizeSizes(product?.sizes);
    return norm.length ? norm : ROSHARA_SIZES;
  })();

  useEffect(() => {
    if (showQuickAdd) {
      setSelectedSize((prev) => prev ?? sizeOptions[0]);
      setLining("without");
    } else {
      setSelectedSize(null);
      setShowCustomInputs(false);
      setCustomBust("");
      setCustomWaist("");
      setCustomHips("");
      setCustomShoulder("");
    }
    setCurrentImage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQuickAdd, product?._id]);

  const onDocumentClick = useCallback(
    (e) => {
      if (!showQuickAdd) return;
      const node = quickAddRef.current;
      if (
        node &&
        !node.contains(e.target) &&
        !wrapperRef.current?.contains(e.target)
      ) {
        setShowQuickAdd(false);
      }
    },
    [showQuickAdd]
  );

  useEffect(() => {
    if (!showQuickAdd) return;
    document.addEventListener("mousedown", onDocumentClick);
    const onKey = (ev) => {
      if (ev.key === "Escape") setShowQuickAdd(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showQuickAdd, onDocumentClick]);

  const heightClass = size === "lg" ? "h-[420px] md:h-[460px]" : "h-[350px]";
  const fav = product ? inWishlist(product._id) : false;

  function buildCustomSizeObject() {
    if (!customBust && !customWaist && !customHips && !customShoulder)
      return null;
    return {
      bust: customBust ? String(customBust).trim() : "",
      waist: customWaist ? String(customWaist).trim() : "",
      hips: customHips ? String(customHips).trim() : "",
      shoulder: customShoulder ? String(customShoulder).trim() : "",
    };
  }

  // compute unit price for quick-add based on lining selection if product supports it
  const getUnitPrice = () => {
    if (!product) return 0;
    if (product.hasLiningOption && String(lining).toLowerCase() === "with") {
      const lp = Number(product.liningPrice);
      if (Number.isFinite(lp) && lp > 0) return lp;
    }
    return Number(product.price || 0);
  };

  const handleAddFromQuick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const customSize = buildCustomSizeObject();
    if (!selectedSize && !customSize) return;

    const extra = isLargeSize(selectedSize) ? EXTRA_FOR_LARGE : 0;

    addItem({
      product: product._id,
      name: product.name,
      price: Number(getUnitPrice()),
      image: images[0],
      size: selectedSize,
      qty: 1,
      customSize,
      extra,
      lining: product.hasLiningOption
        ? String(lining || "").toLowerCase() === "with"
          ? "with"
          : "without"
        : null,
    });
    openMiniCart?.();
    setShowQuickAdd(false);
  };

  const computeQuickAddPosition = () => {
    try {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return { top: "0.5rem", right: "0.5rem" };

      const popupWidth = 280; // width of popup
      const spaceRight = window.innerWidth - rect.right;
      const spaceLeft = rect.left;

      // if enough space on the right → open from top-right of product card
      if (spaceRight > popupWidth + 20) {
        return { top: "0", right: "0" };
      }

      // if not enough space on the right → open from top-left corner of that card
      if (spaceLeft > popupWidth + 20) {
        return { top: "0", left: "0" };
      }

      // fallback for small screens → open just below card (centered)
      return {
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginTop: "0.5rem",
      };
    } catch {
      return { top: "0", right: "0" };
    }
  };

  const quickAddAria = showQuickAdd
    ? { role: "dialog", "aria-modal": "true" }
    : {};

  return (
    <Link
      href={`/products/${product?._id}`}
      className="group relative cursor-pointer block"
      ref={wrapperRef}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      aria-label={`Open ${product?.name}`}
    >
      <motion.div
        className={`relative w-full ${heightClass} overflow-hidden rounded-2xl shadow-sm`}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <img
          src={images[currentImage]}
          alt={product?.name || "Product"}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.png";
          }}
        />

        <div className="absolute top-5 right-3 flex flex-col items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
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

      <div className="text-center mt-3">
        <h3 className="font-semibold text-2xl text-gray-800 line-clamp-1">
          {product?.name}
        </h3>
        <p className="text-gray-600 text-lg font-semibold">
          ₹{Number(product?.price || 0).toLocaleString("en-IN")}
        </p>
      </div>

      {showQuickAdd && (
        <div
          ref={quickAddRef}
          {...quickAddAria}
          className="absolute top-2 right-2 w-64 sm:w-72 bg-white shadow-xl rounded-xl p-4 z-50 border border-gray-100 
               transition-all duration-300"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded overflow-hidden bg-gray-100">
                <img
                  src={images[0]}
                  alt={product?.name}
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                />
              </div>
              <div>
                <div className="font-medium">{product?.name}</div>
                <div className="text-sm text-amber-700 font-semibold">
                  ₹{getUnitPrice()}
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCustomInputs((s) => !s);
              }}
              className="text-sm px-3 py-1 border rounded-md bg-white hover:bg-gray-50"
              title="Add custom measurements"
            >
              Custom
            </button>
          </div>

          {/* Lining selector if product allows it */}
          {product?.hasLiningOption && (
            <div className="mb-3">
              <p className="text-sm font-semibold mb-2">Lining</p>
              <div className="flex gap-2">
                <button
                  onClick={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    setLining("without");
                  }}
                  className={`px-3 py-1 rounded-md border text-sm ${
                    lining === "without" ? "bg-black text-white" : "bg-white"
                  }`}
                  type="button"
                >
                  Without lining (₹{Number(product.price)})
                </button>
                <button
                  onClick={(ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    setLining("with");
                  }}
                  className={`px-3 py-1 rounded-md border text-sm ${
                    lining === "with" ? "bg-black text-white" : "bg-white"
                  }`}
                  type="button"
                >
                  With lining (₹{Number(product.liningPrice)})
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Choose lining option. Price updates above.
              </div>
            </div>
          )}

          <div className="mb-3">
            <p className="text-sm font-semibold mb-2">Select Size</p>
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
            <div className="text-xs text-gray-500 mt-2">
              Note: Sizes <strong>XL and above</strong> include a ₹
              {EXTRA_FOR_LARGE} surcharge.
            </div>
          </div>

          {showCustomInputs && (
            <div className="mb-3 space-y-2">
              <p className="text-sm font-semibold">
                Custom measurements (in inches)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customBust}
                  onChange={(e) => setCustomBust(e.target.value)}
                  placeholder="Bust"
                  className="border rounded px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  value={customWaist}
                  onChange={(e) => setCustomWaist(e.target.value)}
                  placeholder="Waist"
                  className="border rounded px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  value={customHips}
                  onChange={(e) => setCustomHips(e.target.value)}
                  placeholder="Hips"
                  className="border rounded px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  value={customShoulder}
                  onChange={(e) => setCustomShoulder(e.target.value)}
                  placeholder="Shoulder"
                  className="border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAddFromQuick}
              className="flex-1 bg-black text-white py-2 rounded"
              aria-label="Add to bag"
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
