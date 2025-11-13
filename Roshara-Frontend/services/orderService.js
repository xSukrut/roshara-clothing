// services/orderService.js
import api from "../lib/apiClient";

/** helper to attach token explicitly (apiClient also sets token from localStorage) */
const auth = (token) => ({
  headers: token ? { Authorization: `Bearer ${token}` } : {},
});


export const listOrdersAdmin = async (token, { q = "", status = "" } = {}) => {
  const params = { q, status };

  // preferred endpoint (your backend has router.get("/admin", ...))
  const candidates = [
    { url: "/orders/admin", opts: { ...auth(token), params } },
    { url: "/admin/orders", opts: { ...auth(token), params } }, // fallback
  ];

  let lastErr;
  for (const c of candidates) {
    try {
      const res = await api.get(c.url, c.opts);
      console.info("listOrdersAdmin: used endpoint", c.url);
      return Array.isArray(res.data) ? res.data : res.data;
    } catch (err) {
      lastErr = err;
      // try next candidate
    }
  }

  const attempted = candidates.map((c) => c.url).join(", ");
  lastErr.message = `Admin orders fetch failed. Attempted: ${attempted}. Last error: ${lastErr?.message || ""}`;
  throw lastErr;
};

/**
 * Admin: update order status.
 * Tries likely endpoints: PUT /orders/:id/status (preferred), then /admin/orders/:id/status.
 */
export const adminUpdateOrderStatus = async (token, orderId, status) => {
  const body = { status };
  const candidates = [
    { url: `/orders/${orderId}/status`, opts: auth(token) },
    { url: `/admin/orders/${orderId}/status`, opts: auth(token) },
  ];

  let lastErr;
  for (const c of candidates) {
    try {
      const { data } = await api.put(c.url, body, c.opts);
      console.info("adminUpdateOrderStatus: used endpoint", c.url);
      return data;
    } catch (err) {
      lastErr = err;
    }
  }

  lastErr.message = `Update order status failed. Tried: ${candidates.map(c=>c.url).join(", ")}. Last error: ${lastErr?.message || ""}`;
  throw lastErr;
};

/* ----------------- user endpoints ----------------- */

/** List current user's orders -> GET /orders/my */
export const listMyOrders = async (token) => {
  const { data } = await api.get("/orders/my", auth(token));
  return Array.isArray(data) ? data : data;
};

/** Get order by id -> GET /orders/:id */
export const getOrderById = async (token, id) => {
  const { data } = await api.get(`/orders/${id}`, auth(token));
  return data;
};

/** Create order -> POST /orders */
export const createOrder = async (token, payload) => {
  const { data } = await api.post("/orders", payload, auth(token));
  return data;
};

/** Submit UPI proof -> POST /orders/:id/upi-proof */
export const submitUpiProof = async (token, id, transactionId) => {
  const { data } = await api.post(
    `/orders/${id}/upi-proof`,
    { transactionId },
    auth(token)
  );
  return data;
};
