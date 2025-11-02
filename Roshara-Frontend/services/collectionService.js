import axios from "axios";
import { API_BASE_URL } from "@/utils/api";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "");


async function getJSON(url, options) {
  const res = await fetch(url, {
    ...options,
    
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

export async function getAllCollections() {
  return getJSON(`${API_BASE}/collections`);
}

export async function getCollection(id) {
  if (!id) throw new Error("getCollection: id is required");
  return getJSON(`${API_BASE}/collections/${id}`);
}

export const getCollectionProductsAdmin = async (id, token) => {
  const { data } = await axios.get(`${API_BASE_URL}/collections/${id}/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const updateCollectionProductsAdmin = async (id, payload, token) => {
  const { data } = await axios.put(
    `${API_BASE_URL}/collections/${id}/products`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
};