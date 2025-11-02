import axios from "axios";
import { API_BASE_URL } from "../utils/api";

export const getAllProducts = async () => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/products`, {
      params: { _ts: Date.now() },  // cache-buster
    });
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error fetching products:", err?.message);
    return [];
  }
};

export const getProductById = async (id) => {
  const { data } = await axios.get(`${API_BASE_URL}/products/${id}`, {
    params: { _ts: Date.now() },
  });
  return data;
};

export const getProductsByCollection = async (collectionId) => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/products/by-collection/${collectionId}`);
    return data;
  } catch (err) {
    console.error("Error fetching products by collection:", err.message);
    return [];
  }
};

export const getProduct = getProductById;
export default { getAllProducts, getProductById, getProductsByCollection, getProduct };