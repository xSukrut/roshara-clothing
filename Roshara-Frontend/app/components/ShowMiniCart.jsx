"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useCart, lineKey } from "@context/CartContext";
import Image from "next/image";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { resolveImg } from "@/utils/img";

export default function ShowMiniCart() {
  const { items, removeItem, itemsPrice, shippingPrice, taxPrice, totalPrice } =
    useCart();

  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const closeMiniCart = () => setMiniCartOpen(false);

  useEffect(() => {
    const openHandler = () => setMiniCartOpen(true);
    document.addEventListener("openMiniCart", openHandler);
    return () => document.removeEventListener("openMiniCart", openHandler);
  }, []);

  return (
    <AnimatePresence>
      {miniCartOpen && (
        <motion.div
          initial={{ opacity: 0, x: 80, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, y: -30, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed top-6 right-6 w-96 max-h-[90vh] flex flex-col backdrop-blur-xl bg-white/90 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-2xl z-50 p-6 overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-3">
            <h2 className="text-xl font-semibold tracking-wide text-[#44120F]">
              Your Bag
            </h2>
            <button
              onClick={closeMiniCart}
              className="p-1.5 rounded-full hover:bg-gray-100 transition"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-600 hover:text-black transition" />
            </button>
          </div>

          {/* Items */}
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-gray-500 py-8 text-sm">
              <p>Your cart is empty.</p>
              <Link
                href="/shop"
                onClick={closeMiniCart}
                className="mt-4 text-sm font-medium text-white bg-black px-4 py-2 rounded-full hover:bg-gray-900 transition"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                {items.map((item) => (
                  <motion.div
                    key={lineKey(item.product, item.size)}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 border-b border-gray-100 p-2 hover:bg-gray-50/70 rounded-lg transition-all"
                  >
                    {/* Image */}
                    <div className="relative w-18 h-18 rounded-lg overflow-hidden bg-gray-100 group">
                      <Image
                        src={resolveImg(item.image)}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 leading-tight">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.size && `Size: ${item.size} • `}₹{item.price} ×{" "}
                        {item.qty}
                      </p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.product, item.size)}
                      className="p-1 rounded-full hover:bg-red-50 transition"
                      title="Remove item"
                    >
                      <X className="w-4 h-4 text-red-500 hover:text-red-600" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-5 border-t border-gray-200 pt-3 text-sm space-y-1 text-gray-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{itemsPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="font-medium">
                    {shippingPrice === 0 ? "Free" : `₹${shippingPrice}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span className="font-medium">₹{taxPrice}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-gray-200 pt-2 text-base text-gray-900">
                  <span>Total</span>
                  <span className="text-amber-700">₹{totalPrice}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                href="/cart"
                onClick={closeMiniCart}
                className="mt-5 block text-center bg-black text-white py-2.5 rounded-xl font-medium hover:bg-gray-900 active:scale-[0.98] transition-all"
              >
                Go to Checkout
              </Link>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
