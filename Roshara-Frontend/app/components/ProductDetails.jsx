// app/components/ProductDetails.jsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useCart } from "../../context/CartContext"; // adjust path if needed
import { resolveImg } from "@/utils/img";

const SIZE_CHART = {
  "6XS": { bust: 22, waist: 15, hips: 25, shoulder: 13 },
  "5XS": { bust: 24, waist: 17, hips: 27, shoulder: 13 },
  "4XS": { bust: 26, waist: 19, hips: 29, shoulder: 13 },
  "3XS": { bust: 28, waist: 21, hips: 31, shoulder: 13 },
  "2XS": { bust: 30, waist: 23, hips: 33, shoulder: 14 },
  XS: { bust: 32, waist: 25, hips: 35, shoulder: 14 },
  S: { bust: 34, waist: 27, hips: 37, shoulder: 14 },
  M: { bust: 36, waist: 29, hips: 39, shoulder: 14 },
  L: { bust: 38, waist: 31, hips: 41, shoulder: 15 },
  XL: { bust: 40, waist: 33, hips: 43, shoulder: 15 },
  "2XL": { bust: 42.5, waist: 35.5, hips: 45.5, shoulder: 15.5 },
  "3XL": { bust: 45, waist: 38, hips: 48, shoulder: 15.5 },
  "4XL": { bust: 47.5, waist: 40.5, hips: 50.5, shoulder: 16 },
  "5XL": { bust: 50, waist: 43, hips: 53, shoulder: 16 },
  "6XL": { bust: 53, waist: 46, hips: 56, shoulder: 17 },
};
const ALL_SIZES = Object.keys(SIZE_CHART);

function normalizeSizes(list) {
  if (!Array.isArray(list) || list.length === 0) return ALL_SIZES;
  const set = new Set(list.filter((s) => SIZE_CHART[s]));
  return ALL_SIZES.filter((s) => set.has(s));
}

function imagesFromProduct(product) {
  const candidates = product?.images?.length ? product.images : [product?.image];
  const out = (candidates || []).map((img) => resolveImg(img)).filter(Boolean);
  return out.length ? out : ["/placeholder.png"];
}

// surcharge rule (shared)
const EXTRA_FOR_LARGE = 200;
const XL_THRESHOLDS = { bust: 40, waist: 33, hips: 43, shoulder: 15 };

function isLargeSizeLabel(size) {
  if (!size) return false;
  const s = String(size).toUpperCase().replace(/\s+/g, "");
  if (s === "XL" || s === "XXL") return true;
  const m = s.match(/^(\d+)XL$/);
  if (m && Number(m[1]) >= 2) return true;
  const m2 = s.match(/^(\d+)X$/);
  if (m2 && Number(m2[1]) >= 2) return true;
  return false;
}
function isLargeByCustomMeasurements(custom = {}) {
  try {
    if (!custom) return false;
    const bust = custom.bust ? Number(custom.bust) : null;
    const waist = custom.waist ? Number(custom.waist) : null;
    const hips = custom.hips ? Number(custom.hips) : null;
    const shoulder = custom.shoulder ? Number(custom.shoulder) : null;

    if (bust !== null && !Number.isNaN(bust) && bust > XL_THRESHOLDS.bust) return true;
    if (waist !== null && !Number.isNaN(waist) && waist > XL_THRESHOLDS.waist) return true;
    if (hips !== null && !Number.isNaN(hips) && hips > XL_THRESHOLDS.hips) return true;
    if (shoulder !== null && !Number.isNaN(shoulder) && shoulder > XL_THRESHOLDS.shoulder) return true;

    return false;
  } catch {
    return false;
  }
}

export default function ProductDetails({ product, onClose, onAddToCart }) {
  const { addItem, openMiniCart } = useCart();
  const gallery = useMemo(() => imagesFromProduct(product), [product]);
  const [active, setActive] = useState(0);
  const sizes = useMemo(() => normalizeSizes(product?.sizes), [product?.sizes]);

  // Start with null; set when sizes available
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    if ((selected === null || selected === undefined) && sizes && sizes.length) {
      const pref = product?.selectedSize || product?.size || product?.defaultSize || sizes[0];
      setSelected(pref);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizes, product]);

  const [qty, setQty] = useState(1);
  const [showGuide, setShowGuide] = useState(false);
  const [err, setErr] = useState("");

  const measures = selected ? SIZE_CHART[selected] : null;

  // lining + custom
  const [lining, setLining] = useState("without");
  const [useCustom, setUseCustom] = useState(false);
  const [customSize, setCustomSize] = useState({ bust: "", waist: "", hips: "", shoulder: "" });

  const addToCart = () => {
    setErr("");

    // derive chosenSize
    let chosenSize = null;
    if (!useCustom) {
      chosenSize = selected || (sizes && sizes.length ? sizes[0] : null);
    }

    if (!useCustom && !chosenSize) {
      setErr("Please select a size or provide custom measurements.");
      return;
    }
    if (useCustom) {
      const any = customSize.bust || customSize.waist || customSize.hips || customSize.shoulder;
      if (!any) {
        setErr("Please provide at least one custom measurement.");
        return;
      }
    }

    const extra = (isLargeSizeLabel(chosenSize) || (useCustom && isLargeByCustomMeasurements(customSize))) ? EXTRA_FOR_LARGE : 0;

    let unitPrice = Number(product.price || 0);
    if (product.hasLiningOption && String(lining).toLowerCase() === "with") {
      const lp = Number(product.liningPrice || 0);
      if (Number.isFinite(lp) && lp > 0) unitPrice = lp;
    }

    const preparedCustom = useCustom ? {
      bust: String(customSize.bust || "").trim() || undefined,
      waist: String(customSize.waist || "").trim() || undefined,
      hips: String(customSize.hips || "").trim() || undefined,
      shoulder: String(customSize.shoulder || "").trim() || undefined,
    } : null;

    const item = {
      product: product._id || product?.id || product,
      name: product.name,
      price: Number(unitPrice),
      image: gallery[0],
      size: useCustom ? null : chosenSize,
      qty: Number(qty || 1),
      customSize: preparedCustom,
      extra,
      lining: product.hasLiningOption ? (String(lining || "").toLowerCase() === "with" ? "with" : "without") : null,
    };

    if (typeof onAddToCart === "function") {
      onAddToCart(item);
    } else {
      addItem(item);
      openMiniCart?.();
    }

    onClose?.();
  };

  return (
    <div className=" fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs">
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3">
        <div className="relative bg-white w-full max-w-3xl rounded-xl overflow-hidden shadow-lg max-h-[98vh]">
          <button
            className="absolute top-3 right-3 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid md:grid-cols-2 gap-4 p-4 overflow-auto" style={{ maxHeight: "85vh" }}>
            <div>
              <div className="relative w-full h-85 rounded-lg overflow-hidden bg-gray-100">
                <img src={gallery[active]} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="mt-3 flex gap-2">
                {gallery.map((src, i) => (
                  <button
                    key={src + i}
                    className={`relative w-16 h-20 rounded overflow-hidden border ${i === active ? "border-black" : "border-gray-200"}`}
                    onClick={() => setActive(i)}
                  >
                    <img src={src} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs tracking-wide text-gray-500">ROSHARA</div>
              <h1 className="text-xl font-semibold mt-1 truncate">{product.name}</h1>
              <div className="mt-1 text-2xl font-semibold">
                ₹{Number(product.price || 0).toLocaleString("en-IN")}
              </div>

              {product.hasLiningOption && (
                <div className="mt-1">
                  <div className="text-sm font-semibold mb-1">Lining</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLining("without")}
                      className={`px-2 py-1 rounded border text-sm ${lining === "without" ? "bg-black text-white" : "bg-white"}`}
                    >
                      Without lining (₹{Number(product.price || 0)})
                    </button>
                    <button
                      onClick={() => setLining("with")}
                      className={`px-2 py-1 rounded border text-sm ${lining === "with" ? "bg-black text-white" : "bg-white"}`}
                    >
                      With lining (₹{Number(product.liningPrice || 0)})
                    </button>
                  </div>
                  <div className="mt-1 text-xs">Preview: <strong>₹{(product.hasLiningOption && lining === "with") ? product.liningPrice : product.price}</strong></div>
                </div>
              )}

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">Size Chart</div>
                  <button type="button" onClick={() => setShowGuide(true)} className="text-sm underline underline-offset-4 text-gray-600 hover:text-black">
                    Size Guide
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setUseCustom(false); setSelected(s); }}
                      className={`min-w-[44px] h-8 rounded-full border px-2 text-sm ${selected === s ? "border-black" : "border-gray-300"} hover:border-black`}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="mt-2">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={useCustom} onChange={(e) => { setUseCustom(Boolean(e.target.checked)); if (e.target.checked) setSelected(null); else if (!selected && sizes && sizes.length) setSelected(sizes[0]); }} />
                    <span className="text-sm">Provide custom measurements</span>
                  </label>
                </div>

                {useCustom && (
                  <div className="mt-2 grid grid-cols-2 gap-2 max-w-md text-sm">
                    <input placeholder="Bust (inches)" value={customSize.bust} onChange={(e) => setCustomSize({ ...customSize, bust: e.target.value })} className="border rounded px-2 py-1" />
                    <input placeholder="Waist (inches)" value={customSize.waist} onChange={(e) => setCustomSize({ ...customSize, waist: e.target.value })} className="border rounded px-2 py-1" />
                    <input placeholder="Hips (inches)" value={customSize.hips} onChange={(e) => setCustomSize({ ...customSize, hips: e.target.value })} className="border rounded px-2 py-1" />
                    <input placeholder="Shoulder (inches)" value={customSize.shoulder} onChange={(e) => setCustomSize({ ...customSize, shoulder: e.target.value })} className="border rounded px-2 py-1" />
                    <div className="text-xs text-gray-500 col-span-2">A ₹{EXTRA_FOR_LARGE} surcharge applies if any measurement exceeds XL thresholds.</div>
                  </div>
                )}

                {measures && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <Spec label="Bust" value={measures.bust} />
                    <Spec label="Waist" value={measures.waist} />
                    <Spec label="Hips" value={measures.hips} />
                    <Spec label="Shoulder" value={measures.shoulder} />
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-1">All measurements in inches.</div>
                {err && <div className="mt-2 text-sm text-red-600">{err}</div>}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="text-sm text-gray-600">Qty</div>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 border rounded hover:bg-gray-50" onClick={() => setQty((q) => Math.max(1, q - 1))}>–</button>
                  <div className="w-8 text-center">{qty}</div>
                  <button className="w-8 h-8 border rounded hover:bg-gray-50" onClick={() => setQty((q) => q + 1)}>+</button>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 text-sm" onClick={addToCart}>Add to Cart</button>
              </div>

              <div className="mt-3 text-xs text-gray-600">🚚 Free Delivery On Orders Over ₹2000</div>
              <div className="mt-1 text-xs text-gray-500">Note: Sizes <strong>XL and above</strong> include an additional ₹{EXTRA_FOR_LARGE}.</div>
            </div>
          </div>
        </div>

        {showGuide && <SizeGuideModal onClose={() => setShowGuide(false)} />}
      </div>
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div className="border rounded px-2 py-1 text-xs">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="font-medium">{value}"</div>
    </div>
  );
}

function SizeGuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-110 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="text-lg font-semibold">Size Guide</h3>
          <button onClick={onClose} className="text-sm text-gray-600 hover:text-black">Close</button>
        </div>
        <div className="max-h-[70vh] overflow-auto p-4">
          <img src="/size-guide.jpg" alt="Roshara Size Guide" className="w-full h-auto rounded" />
        </div>
      </div>
    </div>
  );
}
