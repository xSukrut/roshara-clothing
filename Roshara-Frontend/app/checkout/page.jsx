// app/checkout/page.jsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useAuth } from "@context/AuthContext";
import { useCart } from "@context/CartContext";

import { createOrder, submitUpiProof } from "@services/orderService";
import { getActiveCoupons } from "@services/couponService";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const { items, itemsPrice, setQty, removeItem, clear } = useCart();

  const [address, setAddress] = useState({ address: "", city: "", postalCode: "", country: "India" });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [couponInput, setCouponInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login?next=/checkout");
    }
  }, [user, loading, router]);

  useEffect(() => {
    getActiveCoupons().then(setActiveCoupons).catch(() => setActiveCoupons([]));
  }, []);

  useEffect(() => {
    function onDoc(e) {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) setShowDropdown(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const selectedCoupon = useMemo(() => {
    if (!couponInput) return null;
    const code = couponInput.trim().toUpperCase();
    return activeCoupons.find((c) => (c.code || "").toUpperCase() === code) || null;
  }, [activeCoupons, couponInput]);

  const estimated = useMemo(() => {
    const subtotal = Number(itemsPrice || 0);
    let discount = 0;
    if (selectedCoupon) {
      const meetsMin = subtotal >= Number(selectedCoupon.minOrderAmount || 0);
      const notExpired = !selectedCoupon.expiryDate || new Date(selectedCoupon.expiryDate) >= new Date();
      const isActive = !!selectedCoupon.active;
      if (meetsMin && notExpired && isActive) {
        if (selectedCoupon.discountType === "percentage") discount = Math.round((subtotal * Number(selectedCoupon.value)) / 100);
        else discount = Number(selectedCoupon.value || 0);
        const cap = Number(selectedCoupon.maxDiscount || 0);
        if (cap > 0) discount = Math.min(discount, cap);
      }
    }
    const shipping = 0;
    const tax = 0;
    const codFee = paymentMethod === "cod" ? 90 : 0;
    const total = Math.max(0, subtotal - discount + shipping + tax + codFee);
    return { subtotal, discount, shipping, tax, codFee, total };
  }, [itemsPrice, selectedCoupon, paymentMethod]);

  const getPid = (it) => it?.product || it?._id || it?.id;

  const handlePlaceOrder = async () => {
    setError("");
    if (!Array.isArray(items) || items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!address.address || !address.city || !address.postalCode) {
      setError("Please fill your address completely.");
      return;
    }

    setPlacing(true);
    try {
      const orderItems = items.map((it) => ({
        product: getPid(it),
        name: it.name,
        quantity: it.qty ?? it.quantity ?? 1,
        price: it.price,
        size: it.size,
        customSize: it.customSize || null,
        extra: Number(it.extra || 0), // send surcharge per unit
      }));

      const payload = {
        orderItems,
        shippingAddress: address,
        paymentMethod,
        taxPrice: 0,
        shippingPrice: 0,
        couponCode: couponInput ? couponInput.trim().toUpperCase() : null,
      };

      const order = await createOrder(token, payload);

      if (paymentMethod === "cod") {
        clear();
        router.push(`/order/${order._id}?status=pending`);
      } else {
        setOrderId(order._id);
      }
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to place order.");
    } finally {
      setPlacing(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!transactionId.trim()) {
      setError("Please enter your UPI Transaction ID.");
      return;
    }
    try {
      await submitUpiProof(token, orderId, transactionId);
      clear();
      router.push(`/order/${orderId}?status=pending_verification`);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Payment submission failed.");
    }
  };

  const keyFor = (it) => getPid(it) || `${it.name}-${Math.random()}`;

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return null;

  // total extra for display
  const totalExtra = items.reduce((s, it) => s + (Number(it.extra || 0) * (it.qty || 1)), 0);

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
      <section className="md:col-span-2">
        <h2 className="text-xl font-semibold mb-4">Bag</h2>

        {!Array.isArray(items) || items.length === 0 ? (
          <p>Your bag is empty.</p>
        ) : (
          <div className="space-y-4">
            {items.map((it) => (
              <div key={keyFor(it)} className="border rounded p-4 flex gap-4">
                <img src={it.image || "/placeholder.png"} alt={it.name} className="w-20 h-20 object-cover rounded" />
                <div className="flex-1">
                  <div className="font-medium">{it.name}</div>
                  <div className="text-sm text-gray-600">₹{it.price}</div>
                  {it.extra && Number(it.extra) > 0 && <div className="text-sm text-gray-600">Surcharge: ₹{it.extra}</div>}
                  {it.size && <div className="text-sm text-gray-600">Size: {it.size}</div>}
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-sm">Qty</label>
                    <input type="number" min="1" value={it.qty} onChange={(e) => setQty(getPid(it), Number(e.target.value))} className="w-16 border rounded px-2 py-1" />
                    <button onClick={() => removeItem(getPid(it))} className="text-red-600 text-sm ml-3">Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Address, Payment, Coupons (unchanged) */}
        <div className="mt-8">
          <h3 className="font-semibold mb-2">Delivery Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Address" className="border rounded px-3 py-2" value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} />
            <input placeholder="City" className="border rounded px-3 py-2" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
            <input placeholder="PIN Code" className="border rounded px-3 py-2" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} />
            <input placeholder="Country" className="border rounded px-3 py-2" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-semibold mb-2">Payment Method</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="radio" name="pay" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
              <span>Cash on Delivery (COD) — ₹90 COD fee applies</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="pay" checked={paymentMethod === "upi"} onChange={() => setPaymentMethod("upi")} />
              <span>UPI (Google Pay / PhonePe / Paytm)</span>
            </label>
          </div>
        </div>

        <div className="mt-6" ref={dropdownRef}>
          <label className="font-medium block mb-1">Apply Coupon</label>
          <div className="relative">
            <input type="text" placeholder="Enter coupon code or click to see available coupons" className="border rounded px-3 py-2 w-full" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} onFocus={() => setShowDropdown(true)} />
            {showDropdown && activeCoupons.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow z-40 max-h-44 overflow-auto">
                {activeCoupons.map((c) => (
                  <button key={c._id} onClick={() => { setCouponInput(c.code || ""); setShowDropdown(false); }} className="w-full text-left px-3 py-2 hover:bg-gray-50" title={c.description || ""}>
                    <div className="flex justify-between">
                      <span className="font-medium">{c.code}</span>
                      <span className="text-sm text-gray-600">{c.discountType === "percentage" ? `${c.value}%` : `₹${c.value}`}</span>
                    </div>
                    {Number(c.minOrderAmount) > 0 && <div className="text-xs text-gray-500">min ₹{c.minOrderAmount}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-600">Tip: If you received a special influencer coupon, type it above. Public coupons are shown in the list.</div>
        </div>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        <button onClick={handlePlaceOrder} disabled={placing || (Array.isArray(items) && items.length === 0)} className="mt-6 bg-black text-white px-6 py-3 rounded hover:bg-gray-800 disabled:opacity-50">{placing ? "Placing..." : "Place Order"}</button>

        {orderId && paymentMethod === "upi" && (
          <div className="mt-8 border rounded-xl p-6 bg-gray-50 shadow-sm max-w-md">
            <h4 className="font-semibold text-lg mb-4 text-center">Pay via UPI</h4>
            <div className="flex flex-col items-center">
              <Image src="/static/upi-qr.png" alt="UPI QR Code" width={220} height={220} priority className="rounded-xl border mb-4" />
              <div className="text-center text-gray-700 mb-2">
                <p className="font-medium"><span className="text-gray-600">UPI ID: 9324103174@kotak811</span></p>
                <p><span className="text-gray-600">Amount:</span> ₹{estimated.total}</p>
              </div>

              <div className="mt-4 w-full">
                <label className="text-sm font-medium block mb-1">Enter UPI Transaction ID</label>
                <input type="text" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Example: T1234ABCD567" className="w-full border rounded-lg px-3 py-2" />
              </div>

              <button onClick={handleMarkPaid} className="mt-5 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">I’ve Paid</button>
            </div>
          </div>
        )}
      </section>

      <aside className="md:col-span-1 border rounded p-4 h-fit">
        <h3 className="font-semibold mb-3">Price Details</h3>

        <div className="flex justify-between text-sm"><span>Items Total</span><span>₹{estimated.subtotal}</span></div>

        {totalExtra > 0 && (<div className="flex justify-between text-sm mt-1"><span>Size surcharge</span><span>₹{totalExtra}</span></div>)}

        <div className="flex justify-between text-sm mt-1"><span>Shipping</span><span>FREE</span></div>

        {estimated.discount > 0 && (
          <div className="flex justify-between text-sm mt-1 text-green-700">
            <span>Discount{selectedCoupon ? ` (${selectedCoupon.code})` : ""}</span>
            <span>-₹{estimated.discount}</span>
          </div>
        )}

        {estimated.codFee > 0 && (<div className="flex justify-between text-sm mt-1"><span>COD Fee</span><span>₹{estimated.codFee}</span></div>)}

        <hr className="my-3" />

        <div className="flex justify-between font-semibold"><span>Total</span><span>₹{estimated.total}</span></div>
      </aside>
    </div>
  );
}
