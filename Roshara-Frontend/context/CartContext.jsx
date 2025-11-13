// src/context/CartContext.jsx
"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

const STORAGE_KEY = "cart_items_v2";

// surcharge rule (server/client)
const SURCHARGE_FOR_XL_AND_ABOVE = 200;
const XL_THRESHOLDS = { bust: 40, waist: 33, hips: 43, shoulder: 15 };

function isLargeSizeLabel(size) {
  if (!size) return false;
  const s = String(size).toUpperCase().replace(/\s+/g, "");
  if (s === "XL" || s === "XXL") return true;
  const m = s.match(/^(\d+)XL$/);
  if (m && Number(m[1]) >= 2) return true;
  const m2 = s.match(/^(\d+)X$/);
  if (m2 && Number(m2[1]) >= 2) return true;
  return false;
}
function isLargeByCustomMeasurements(custom = {}) {
  try {
    if (!custom) return false;
    const b = custom.bust ? Number(custom.bust) : null;
    const w = custom.waist ? Number(custom.waist) : null;
    const h = custom.hips ? Number(custom.hips) : null;
    const s = custom.shoulder ? Number(custom.shoulder) : null;

    if (b !== null && !Number.isNaN(b) && b > XL_THRESHOLDS.bust) return true;
    if (w !== null && !Number.isNaN(w) && w > XL_THRESHOLDS.waist) return true;
    if (h !== null && !Number.isNaN(h) && h > XL_THRESHOLDS.hips) return true;
    if (s !== null && !Number.isNaN(s) && s > XL_THRESHOLDS.shoulder) return true;

    return false;
  } catch {
    return false;
  }
}
function computeSurchargeForSize(size, customSize = null) {
  if (customSize && isLargeByCustomMeasurements(customSize)) return SURCHARGE_FOR_XL_AND_ABOVE;
  return isLargeSizeLabel(size) ? SURCHARGE_FOR_XL_AND_ABOVE : 0;
}

function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function migrateLoadedItems(items = []) {
  return items.map((it) => {
    try {
      const hasExplicitExtra = typeof it.extra === "number" && it.extra > 0;
      const computed = computeSurchargeForSize(it.size, it.customSize);
      const extra = hasExplicitExtra ? Number(it.extra || 0) : computed;
      return {
        ...it,
        price: Number(it.price || 0),
        qty: Number(it.qty || it.quantity || 1),
        extra: Number(extra || 0),
        lining: it.lining ? String(it.lining) : null,
      };
    } catch {
      return {
        ...it,
        price: Number(it.price || 0),
        qty: Number(it.qty || it.quantity || 1),
        extra: Number(it.extra || 0),
        lining: it.lining ? String(it.lining) : null,
      };
    }
  });
}

function save(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const lineKey = (product, size, customSize, extra = 0, lining = null) =>
  `${product}__${size || "NOSIZE"}__${customSize ? JSON.stringify(customSize) : "NOCUST"}__${Number(extra || 0)}__${lining || "NO_LIN"}`;

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const raw = loadRaw();
    const migrated = migrateLoadedItems(raw);
    setItems(migrated);
  }, []);

  useEffect(() => {
    save(items);
  }, [items]);

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
    extra = null,
    lining = null,
  }) => {
    if (!product) return;

    // product ID can be object or id
    const productId = typeof product === "object" ? (product._id || product.id || product) : product;

    setItems((prev) => {
      const next = [...prev];

      // if caller didn't pass size but product object contains a default/selected, use it
      let parsedSize = size || null;
      if (!parsedSize && product && typeof product === "object") {
        parsedSize = product.selectedSize || product.size || product.defaultSize || null;
      }

      // compute extra if caller didn't pass
      const parsedExtra =
        typeof extra === "number" && extra > 0 ? Number(extra) : computeSurchargeForSize(parsedSize, customSize);

      const idx = next.findIndex(
        (it) =>
          (String(it.product) === String(productId)) &&
          (it.size || null) === (parsedSize || null) &&
          sameCustom(it.customSize, customSize) &&
          Number(it.extra || 0) === Number(parsedExtra || 0) &&
          (it.lining || null) === (lining || null)
      );

      if (idx >= 0) {
        next[idx] = { ...next[idx], qty: (next[idx].qty || 1) + (Number(qty) || 1) };
      } else {
        next.push({
          product: productId,
          name,
          price: Number(price || 0),
          image,
          size: parsedSize || null,
          qty: Number(qty) || 1,
          customSize: customSize || null,
          extra: Number(parsedExtra || 0),
          lining: lining || null,
        });
      }

      return next;
    });
  };

  const setQty = (product, size, qty, customSize = null, extra = null, lining = null) => {
    const productId = typeof product === "object" ? (product._id || product.id || product) : product;
    setItems((prev) =>
      prev.map((it) =>
        (String(it.product) === String(productId)) &&
        (it.size || null) === (size || null) &&
        (customSize ? sameCustom(it.customSize, customSize) : true) &&
        (extra !== null ? Number(it.extra || 0) === Number(extra || 0) : true) &&
        (lining !== null ? (it.lining || null) === (lining || null) : true)
          ? { ...it, qty: Math.max(1, Number(qty) || 1) }
          : it
      )
    );
  };

  const removeItem = (product, size = null, customSize = null, extra = null, lining = null) => {
    const productId = typeof product === "object" ? (product._id || product.id || product) : product;
    setItems((prev) =>
      prev.filter(
        (it) =>
          !(
            (String(it.product) === String(productId)) &&
            (it.size || null) === (size || null) &&
            (customSize ? sameCustom(it.customSize, customSize) : true) &&
            (extra !== null ? Number(it.extra || 0) === Number(extra || 0) : true) &&
            (lining !== null ? (it.lining || null) === (lining || null) : true)
          )
      )
    );
  };

  const clear = () => setItems([]);

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
export default CartContext;
