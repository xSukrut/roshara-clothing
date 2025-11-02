// app/services/couponService.js
import axios from "axios";
import { API_BASE_URL } from "@/utils/api";

// Public – used on checkout page

export const getActiveCoupons = async () => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/coupons/active`);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("getActiveCoupons failed:", err?.response?.data || err?.message);
    return [];
  }
};

export const listCouponsAdmin = async (token) => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/coupons`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("listCouponsAdmin failed:", err?.response?.data || err?.message);
    throw err;
  }
};

export const createCouponAdmin = async (token, payload) => {
  try {
    const { data } = await axios.post(`${API_BASE_URL}/coupons`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (err) {
    console.error("createCouponAdmin failed:", err?.response?.data || err?.message);
    throw err;
  }
};

export const updateCouponAdmin = async (token, id, payload) => {
  try {
    const { data } = await axios.put(`${API_BASE_URL}/coupons/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (err) {
    console.error("updateCouponAdmin failed:", err?.response?.data || err?.message);
    throw err;
  }
};

export const deleteCouponAdmin = async (token, id) => {
  try {
    const { data } = await axios.delete(`${API_BASE_URL}/coupons/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  } catch (err) {
    console.error("deleteCouponAdmin failed:", err?.response?.data || err?.message);
    throw err;
  }
};
