// services/collectionService.js
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

async function doFetch(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText} - ${txt || url}`);
  }
  return res.json();
}

export async function getAllCollections() {
  try {
    const data = await doFetch("/collections");
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("getAllCollections error:", err);
    return [];
  }
}

export async function getCollection(id) {
  if (!id) return null;
  try {
    return await doFetch(`/collections/${id}`);
  } catch (err) {
    console.error(`getCollection ${id} error:`, err);
    return null;
  }
}

// Admin helpers (token required)
export async function getCollectionProductsAdmin(id, token) {
  if (!id) throw new Error("id required");
  const res = await fetch(`${API_BASE}/collections/${id}/products`, {
    headers: { Authorization: token ? `Bearer ${token}` : undefined },
  });
  if (!res.ok) throw new Error(`Failed to load collection products (${res.status})`);
  return res.json();
}

export async function updateCollectionProductsAdmin(id, payload = {}, token) {
  if (!id) throw new Error("id required");
  const res = await fetch(`${API_BASE}/collections/${id}/products`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : undefined,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed update (${res.status})`);
  return res.json();
}

export default {
  getAllCollections,
  getCollection,
  getCollectionProductsAdmin,
  updateCollectionProductsAdmin,
};
