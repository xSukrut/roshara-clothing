// context/CartContext.jsx
"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

const STORAGE_KEY = "cart_items_v2";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// Helper: build a stable key per line item (product + size + custom signature)
export const lineKey = (product, size, customSize) =>
  `${product}__${size || "NOSIZE"}__${customSize ? JSON.stringify(customSize) : "NOCUST"}`;

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(load());
  }, []);
  useEffect(() => {
    save(items);
  }, [items]);

  // helper to compare customSize objects (both null/undefined considered equal)
  function sameCustom(a, b) {
    if (!a && !b) return true;
    try {
      return JSON.stringify(a || {}) === JSON.stringify(b || {});
    } catch {
      return false;
    }
  }

  const addItem = ({
    product,
    name,
    price,
    image,
    size = null,
    qty = 1,
    customSize = null,
    extra = 0, // new: surcharge per line
  }) => {
    if (!product) return;

    const productId = typeof product === "object" ? product._id : product;

    setItems((prev) => {
      const next = [...prev];
      // find an existing item that matches product, size and customSize
      const idx = next.findIndex(
        (it) =>
          it.product === productId &&
          (it.size || null) === (size || null) &&
          sameCustom(it.customSize, customSize)
      );

      const parsedExtra = Number(extra || 0);

      if (idx >= 0) {
        // merge by increasing qty (keep same extra)
        next[idx] = { ...next[idx], qty: (next[idx].qty || 1) + qty };
      } else {
        next.push({
          product: productId,
          name,
          price: Number(price),
          image,
          size: size || null,
          qty: Number(qty) || 1,
          customSize: customSize || null,
          extra: parsedExtra,
        });
      }
      return next;
    });
  };

  // Set quantity per product + size (+ optional customSize)
  // keep signature backward-compatible: setQty(product, size, qty) or setQty(product, size, qty, customSize)
  const setQty = (product, size, qty, customSize = null) => {
    const productId = typeof product === "object" ? product._id : product;
    setItems((prev) =>
      prev.map((it) =>
        it.product === productId &&
        (it.size || null) === (size || null) &&
        (customSize ? sameCustom(it.customSize, customSize) : true)
          ? { ...it, qty: Math.max(1, Number(qty) || 1) }
          : it
      )
    );
  };

  const removeItem = (product, size = null, customSize = null) => {
    const productId = typeof product === "object" ? product._id : product;

    setItems((prev) =>
      prev.filter(
        (it) =>
          !(
            it.product === productId &&
            (it.size || null) === (size || null) &&
            (customSize ? sameCustom(it.customSize, customSize) : true)
          )
      )
    );
  };

  const clear = () => setItems([]);

  // Totals: include extra per-line in itemsPrice
  const itemsPrice = useMemo(
    () =>
      items.reduce(
        (sum, it) =>
          sum + (Number(it.price || 0) + Number(it.extra || 0)) * (it.qty || 1),
        0
      ),
    [items]
  );

  // You can keep your shipping rules; simple placeholders here:
  const shippingPrice = 0;
  const totalPrice = itemsPrice + shippingPrice;

  // optional: to open a mini cart if you have one
  const openMiniCart = () => document.dispatchEvent(new Event("openMiniCart"));

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        setQty,
        removeItem,
        clear,
        itemsPrice,
        shippingPrice,
        totalPrice,
        openMiniCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
