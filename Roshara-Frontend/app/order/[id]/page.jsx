// app/order/[id]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@context/AuthContext";
import { getOrderById } from "@services/orderService";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const params = useSearchParams();
  const { token } = useAuth();

  const statusFromQuery = params.get("status"); // optional hint from redirect
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || !token) return;
    getOrderById(token, id)
      .then(setOrder)
      .catch((e) => setError(e?.response?.data?.message || "Failed to load order"));
  }, [id, token]);

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!order) return <div className="p-6">Loading…</div>;

  const status = order.status || statusFromQuery || "pending";

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Order #{order._id}</h1>
      <p className="mt-1">
        Status:{" "}
        <b className={status === "paid" ? "text-green-600" : "text-orange-600"}>
          {status}
        </b>
      </p>

      <div className="mt-6 border rounded p-4">
        <h3 className="font-semibold mb-2">Items</h3>
        {order.orderItems.map((it) => (
          <div key={it._id || it.product} className="flex justify-between text-sm py-1">
            <span>{it.name} × {it.quantity}</span>
            <span>₹{it.price * it.quantity}</span>
          </div>
        ))}
        <hr className="my-3" />
        <div className="flex justify-between text-sm">
          <span>Items Total</span><span>₹{order.itemsPrice}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Shipping</span><span>{order.shippingPrice ? `₹${order.shippingPrice}` : "FREE"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax</span><span>₹{order.taxPrice}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span>Discount</span><span>-₹{order.discountAmount}</span>
          </div>
        )}
        <hr className="my-3" />
        <div className="flex justify-between font-semibold">
          <span>Total</span><span>₹{order.totalPrice}</span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-1">Shipping Address</h3>
        <p className="text-sm text-gray-700">
          {order.shippingAddress?.address}, {order.shippingAddress?.city},{" "}
          {order.shippingAddress?.postalCode}, {order.shippingAddress?.country}
        </p>
      </div>
    </div>
  );
}
