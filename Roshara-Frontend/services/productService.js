// services/productService.js
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

// small helper
async function doFetch(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const msg = `API ${res.status} ${res.statusText} - ${text || url}`;
      console.error(msg);
      throw new Error(msg);
    }

    const data = await res.json().catch(() => null);
    return data;
  } catch (err) {
    console.error("Network/API fetch error:", err?.message || err, "URL:", url);
    throw err;
  }
}

/**
 * options:
 *   { collection: "<collectionId>" }  -> will try server-side filter first via query param
 */
export async function getAllProducts(options = {}) {
  try {
    const { collection } = options || {};
    if (collection) {
      // prefer server-side filtering if backend supports it
      try {
        const q = new URLSearchParams({ collection }).toString();
        const data = await doFetch(`/products?${q}`);
        return Array.isArray(data) ? data : [];
      } catch (err) {
        // fallback to fetching all and client filtering
        console.warn("Server-side collection filter failed, falling back to client-side filter", err);
      }
    }

    const data = await doFetch("/products");
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error fetching products:", err?.message || err);
    return [];
  }
}

export async function getProductById(id) {
  if (!id) return null;
  try {
    const data = await doFetch(`/products/${id}`);
    return data || null;
  } catch (err) {
    console.error(`Error fetching product ${id}:`, err?.message || err);
    return null;
  }
}

export async function getFeaturedProducts(limit = 8) {
  try {
    const all = await getAllProducts();
    return all.slice(0, limit);
  } catch (e) {
    return [];
  }
}

export default {
  getAllProducts,
  getProductById,
  getFeaturedProducts,
};
