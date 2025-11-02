import api from "@lib/apiClient";

const auth = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const listOrdersAdmin = async (token, { q = "", status = "" } = {}) => {
  const { data } = await api.get("/orders/admin", {
    ...auth(token),
    params: { q, status },
  });
  return data;
};

export const adminUpdateOrderStatus = async (token, orderId, status) => {
  // status: "paid" | "rejected" | "pending_verification"
  const { data } = await api.put(
    `/orders/${orderId}/status`,
    { status },
    auth(token)
  );
  return data;
};

// List current user's orders
export const listMyOrders = async (token) => {
  const { data } = await api.get("/orders/my", auth(token));
  return Array.isArray(data) ? data : [];
};

export const getOrderById = async (token, id) => {
  const { data } = await api.get(`/orders/${id}`, auth(token));
  return data;
};

export const createOrder = async (token, payload) => {
  const { data } = await api.post("/orders", payload, auth(token));
  return data;
};

export const submitUpiProof = async (token, id, transactionId) => {
  const { data } = await api.post(
    `/orders/${id}/upi-proof`,
    { transactionId },
    auth(token)
  );
  return data;
};
