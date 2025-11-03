"use client";

import { useEffect, useState } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

function urlFor(src) {
  if (!src) return "/placeholder.png";
  try {
    const u = new URL(src, API_BASE);

    // If page is https and URL is http, force https to avoid mixed content
    if (typeof window !== "undefined" && window.location.protocol === "https:" && u.protocol === "http:") {
      u.protocol = "https:";
    }

    // Rewrite localhost/127.* to your public API origin
    if (["localhost", "127.0.0.1"].includes(u.hostname)) {
      u.hostname = new URL(API_BASE).hostname;
      u.port = "";
      u.protocol = new URL(API_BASE).protocol;
    }

    // Always keep backend uploads under your public API origin
    if (u.pathname.startsWith("/uploads")) {
      const base = new URL(API_BASE);
      u.protocol = base.protocol;
      u.host = base.host;
    }

    return u.toString();
  } catch {
    const path = src.startsWith("/") ? src : `/${src}`;
    if (path.startsWith("/uploads")) return `${API_BASE}${path}`;
    return "/placeholder.png";
  }
}

export default function Page() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
    fetch(`${API}/products`)
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data.slice(0, 8) : []))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Image URL Debug</h1>
      <p className="text-sm text-gray-600">
        We show the raw image values from the API and the resolved URL the browser tries to load.
        Any red image means the URL still isn’t reachable.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((p) => {
          const raws = Array.isArray(p.images) && p.images.length ? p.images : [p.image];
          const list = raws.filter(Boolean).slice(0, 2);
          return (
            <div key={p._id} className="border rounded p-3 space-y-2">
              <div className="font-semibold">{p.name}</div>
              {list.length === 0 && <div className="text-xs text-gray-500">No images in payload</div>}
              {list.map((raw, i) => {
                const val = typeof raw === "string" ? raw : (raw?.url || raw?.src || raw?.path || raw?.location || raw?.file);
                const resolved = urlFor(val || "");
                return (
                  <div key={i} className="flex gap-3">
                    <div className="w-28 h-28 bg-gray-100 rounded overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolved}
                        alt="test"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.border = "2px solid red")}
                      />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="text-gray-500">raw:</div>
                      <div className="break-all">{String(val)}</div>
                      <div className="text-gray-500 mt-1">resolved:</div>
                      <a className="text-blue-600 break-all underline" href={resolved} target="_blank" rel="noreferrer">
                        {resolved}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
