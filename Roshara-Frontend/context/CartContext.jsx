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
    if (!Array.isArray(parsed)) return [];
    // Normalize old items: ensure numeric price, qty and extra fields exist
    return parsed.map((it) => ({
      product: it.product,
      name: it.name,
      price: Number(it.price || 0),
      image: it.image || "/placeholder.png",
      size: it.size || null,
      qty: Number(it.qty || it.quantity || 1),
      customSize: it.customSize || null,
      extra: Number(it.extra || 0),
    }));
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
    extra = 0, // surcharge per unit
  }) => {
    if (!product) return;
    const productId = typeof product === "object" ? product._id : product;

    setItems((prev) => {
      const next = [...prev];
      const idx = next.findIndex(
        (it) =>
          it.product === productId &&
          (it.size || null) === (size || null) &&
          sameCustom(it.customSize, customSize)
      );

      const parsedExtra = Number(extra || 0);

      if (idx >= 0) {
        // increase qty and keep existing extra
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

  const shippingPrice = 0;
  const totalPrice = itemsPrice + shippingPrice;

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
