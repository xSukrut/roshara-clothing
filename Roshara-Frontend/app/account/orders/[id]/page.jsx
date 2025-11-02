"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@context/AuthContext";
import { getOrderById } from "@services/orderService";

function StatusBadge({ status }) {
  const map = {
    paid: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    pending_verification: "bg-amber-100 text-amber-700",
    pending: "bg-amber-100 text-amber-700",
  };
  const cls = map[status] || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs ${cls}`}>
      {status || "pending"}
    </span>
  );
}

export default function MyOrderDetailPage() {
  const { id } = useParams();
  const { user, token, loading } = useAuth();
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!id || !token || loading) return;
    (async () => {
      try {
        setErr("");
        const data = await getOrderById(token, id);
        setOrder(data);
      } catch (e) {
        setErr("Failed to load order.");
      }
    })();
  }, [id, token, loading]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return <div className="p-6">Please sign in to view the order.</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!order) return <div className="p-6">Loading…</div>;

  const status = order.paymentStatus || order.status;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold">
          Order <span className="font-mono">#{order._id}</span>
        </h1>
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="border rounded p-4 mb-6">
        <h2 className="font-semibold mb-3">Items</h2>
        <div className="divide-y">
          {order.orderItems?.map((it) => (
            <div key={it._id || it.product} className="py-2 flex justify-between">
              <span>
                {it.name} × {it.quantity || it.qty || 1}
              </span>
              <span>₹{Number(it.price)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span>Items Total</span>
            <span>₹{Number(order.itemsPrice ?? 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{Number(order.shippingPrice ?? 0) === 0 ? "FREE" : `₹${order.shippingPrice}`}</span>
          </div>
          {/* You asked to remove showing tax earlier; keeping it hidden */}
          {/* <div className="flex justify-between">
            <span>Tax</span>
            <span>₹{Number(order.taxPrice ?? 0)}</span>
          </div> */}
          <div className="flex justify-between font-semibold text-lg mt-1">
            <span>Total</span>
            <span>₹{Number(order.totalPrice ?? 0)}</span>
          </div>
        </div>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-semibold mb-2">Shipping Address</h2>
        <div className="text-sm text-gray-700">
          {order.shippingAddress?.address && <div>{order.shippingAddress.address}</div>}
          {order.shippingAddress?.city && <div>{order.shippingAddress.city}</div>}
          <div>
            {(order.shippingAddress?.postalCode || order.shippingAddress?.pinCode) ??
              ""}
          </div>
          {order.shippingAddress?.country && <div>{order.shippingAddress.country}</div>}
        </div>
      </div>
    </div>
  );
}
