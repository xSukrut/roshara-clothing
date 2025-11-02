"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useCart } from "../../../context/CartContext";

const SIZE_CHART = {
  "6XS": { bust: 22, waist: 15, hips: 25, shoulder: 13 },
  "5XS": { bust: 24, waist: 17, hips: 27, shoulder: 13 },
  "4XS": { bust: 26, waist: 19, hips: 29, shoulder: 13 },
  "3XS": { bust: 28, waist: 21, hips: 31, shoulder: 13 },
  "2XS": { bust: 30, waist: 23, hips: 33, shoulder: 14 },
  XS:    { bust: 32, waist: 25, hips: 35, shoulder: 14 },
  S:     { bust: 34, waist: 27, hips: 37, shoulder: 14 },
  M:     { bust: 36, waist: 29, hips: 39, shoulder: 14 },
  L:     { bust: 38, waist: 31, hips: 41, shoulder: 15 },
  XL:    { bust: 40, waist: 33, hips: 43, shoulder: 15 },
  "2XL": { bust: 42.5, waist: 35.5, hips: 45.5, shoulder: 15.5 },
  "3XL": { bust: 45, waist: 38, hips: 48, shoulder: 15.5 },
  "4XL": { bust: 47.5, waist: 40.5, hips: 50.5, shoulder: 16 },
  "5XL": { bust: 50, waist: 43, hips: 53, shoulder: 16 },
  "6XL": { bust: 53, waist: 46, hips: 56, shoulder: 17 },
};

const ALL_SIZES = Object.keys(SIZE_CHART); // for fallback

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { addItem, openMiniCart } = useCart();

  const [product, setProduct] = useState(null);
  const [active, setActive] = useState(0);
  const [size, setSize] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getProduct(id)
      .then((data) => {
        if (!mounted) return;
        setProduct(data);
        // default size: first available from product.sizes → else first from chart
        const available = resolvedSizes(data);
        if (available.length) setSize(available[0]);
      })
      .catch((e) => setErr(e?.response?.data?.message || "Failed to load product"))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, [id]);

  const gallery = useMemo(() => {
    const imgs = (product?.images && product.images.length ? product.images : [product?.image]).filter(Boolean);
    return imgs?.length ? imgs : ["/placeholder.png"];
  }, [product]);

  const main = gallery[active] || "/placeholder.png";
  const sizesAvailable = resolvedSizes(product);

  const selectedMeasures = size ? SIZE_CHART[size] : null;

  if (loading) return <div className="max-w-6xl mx-auto p-6">Loading…</div>;
  if (err || !product) return <div className="max-w-6xl mx-auto p-6 text-red-600">{err || "Not found"}</div>;

  const { name, brand, price, mrp, discountPercent, description, specs } = product || {};

  const handleAdd = () => {
    if (sizesAvailable.length && !size) return;
    addItem({
      product: product._id,
      name: product.name,
      price: product.price,
      qty: 1,
      size: size || null,
      image: gallery[0],
    });
    openMiniCart?.();
  };

  return (
    <main className="max-w-6xl mx-auto p-6 grid gap-10 md:grid-cols-2">
      {/* LEFT: Gallery */}
      <section>
        <div className="hidden md:flex gap-3 mb-4">
          {gallery.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              className={`relative w-20 h-24 rounded-lg overflow-hidden border ${
                i === active ? "border-black" : "border-gray-200"
              }`}
              aria-label={`Preview image ${i + 1}`}
            >
              <img src={src} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <div className="relative w-full aspect-3/4 rounded-xl overflow-hidden border border-gray-200">
          <img src={main} alt={name} className="w-full h-full object-cover" />
        </div>

        <div className="mt-3 md:hidden flex gap-3">
          {gallery.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              className={`relative w-16 h-20 rounded-lg overflow-hidden border ${
                i === active ? "border-black" : "border-gray-200"
              }`}
              aria-label={`Preview image ${i + 1}`}
            >
              <img src={src} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </section>

      {/* RIGHT: Info */}
      <section>
        <div className="text-2xl font-semibold">{brand || "Roshara"}</div>
        <h1 className="text-xl mt-1">{name}</h1>

        <div className="mt-4 flex items-baseline gap-3">
          <div className="text-2xl font-bold">₹{price}</div>
          {mrp ? <div className="line-through text-gray-500">₹{mrp}</div> : null}
          {discountPercent ? <div className="text-green-600 font-semibold">({discountPercent}% OFF)</div> : null}
        </div>
        <div className="text-xs text-gray-600 mt-1">inclusive of all taxes</div>

        {/* Sizes */}
        {sizesAvailable.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold">Select size</div>
              <button
                type="button"
                onClick={() => setShowGuide(true)}
                className="text-xs underline underline-offset-4 text-gray-600 hover:text-black"
              >
                Size guide
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {sizesAvailable.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`w-12 h-12 rounded-full border text-sm ${
                    size === s ? "border-black" : "border-gray-300"
                  } hover:border-black`}
                  aria-label={`Select size ${s}`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Selected measurements */}
            {selectedMeasures && (
              <div className="mt-4 text-sm">
                <div className="font-medium">Selected size: {size}</div>
                <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-gray-700">
                  <Spec label="Bust" value={selectedMeasures.bust} />
                  <Spec label="Waist" value={selectedMeasures.waist} />
                  <Spec label="Hips" value={selectedMeasures.hips} />
                  <Spec label="Shoulder" value={selectedMeasures.shoulder} />
                </div>
                <div className="text-xs text-gray-500 mt-1">All measurements in inches.</div>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-6 flex gap-3">
          <button onClick={handleAdd} className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800">
            ADD TO BAG
          </button>
        </div>

        {/* Description */}
        {description ? (
          <div className="mt-8">
            <h3 className="font-semibold mb-2">Product Description</h3>
            <p className="text-gray-700 leading-relaxed">{description}</p>
          </div>
        ) : null}

        {/* Optional specs block */}
        {specs && Object.values(specs).some(Boolean) && (
          <div className="mt-8">
            <h3 className="font-semibold mb-3">Specifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 text-sm">
              {Object.entries(specs)
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between sm:justify-start sm:gap-8">
                    <div className="text-gray-500 min-w-[140px] capitalize">{k.replace(/([A-Z])/g, " $1")}</div>
                    <div className="font-medium">{v}</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </section>

      {/* Size Guide Modal */}
      {showGuide && <SizeGuideModal onClose={() => setShowGuide(false)} />}
    </main>
  );
}

/** Helpers */
function resolvedSizes(product) {
  const fromProduct =
    Array.isArray(product?.sizes) && product.sizes.length
      ? product.sizes.filter((s) => SIZE_CHART[s])
      : [];
  return fromProduct.length ? fromProduct : ALL_SIZES;
}

function Spec({ label, value }) {
  return (
    <div className="border rounded px-3 py-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value}"</div>
    </div>
  );
}

/** Modal with the size guide image & full table */
function SizeGuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-lg font-semibold">Size Guide</h3>
          <button onClick={onClose} className="text-sm text-gray-600 hover:text-black">Close</button>
        </div>

        <div className="max-h-[75vh] overflow-auto p-5 space-y-5">
          {/* Guide image */}
          <img
            src="/size-guide.jpg"   
            alt="Roshara Size Guide"
            className="w-full h-auto rounded"
          />

          {/* Table (text searchable & accessible) */}
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Measurements (in inches)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Size</Th><Th>Bust</Th><Th>Waist</Th><Th>Hips</Th><Th>Shoulder</Th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(SIZE_CHART).map(([s, m]) => (
                    <tr key={s} className="border-t">
                      <Td>{s}</Td>
                      <Td>{m.bust}"</Td>
                      <Td>{m.waist}"</Td>
                      <Td>{m.hips}"</Td>
                      <Td>{m.shoulder}"</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Tip: For a comfortable fit, compare the size with your best-fitting garment. If you’re between sizes,
            consider going up.
          </p>
        </div>
      </div>
    </div>
  );
}

function Th({ children }) {
  return <th className="text-left font-semibold px-3 py-2 border-r last:border-r-0">{children}</th>;
}
function Td({ children }) {
  return <td className="px-3 py-2 border-r last:border-r-0">{children}</td>;
}
