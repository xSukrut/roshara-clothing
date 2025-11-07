"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

const STORAGE_KEY = "cart_items_v2";

// --- Server/client shared surcharge rule (keep in sync with backend)
const SURCHARGE_FOR_XL_AND_ABOVE = 200;
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
function computeSurchargeForSize(size) {
  return isLargeSizeLabel(size) ? SURCHARGE_FOR_XL_AND_ABOVE : 0;
}
// -----------------------------------------------------------

function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// When loading, migrate items that are missing/incorrect extra
function migrateLoadedItems(items = []) {
  return items.map((it) => {
    try {
      const hasExplicitExtra = typeof it.extra === "number" && it.extra > 0;
      const computed = computeSurchargeForSize(it.size);
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

// Helper: build a stable key per line item (product + size + custom signature + extra + lining)
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
    extra = null, // allow null to mean "not provided"
    lining = null, // "with" or "without" or null
  }) => {
    if (!product) return;

    const productId = typeof product === "object" ? product._id : product;

    setItems((prev) => {
      const next = [...prev];

      // If caller provided a positive extra, use it; otherwise compute from size
      const parsedExtra =
        typeof extra === "number" && extra > 0
          ? Number(extra)
          : computeSurchargeForSize(size);

      // find an existing item that matches product, size, customSize, extra and lining
      const idx = next.findIndex(
        (it) =>
          it.product === productId &&
          (it.size || null) === (size || null) &&
          sameCustom(it.customSize, customSize) &&
          Number(it.extra || 0) === parsedExtra &&
          (it.lining || null) === (lining || null)
      );

      if (idx >= 0) {
        // merge by increasing qty
        next[idx] = { ...next[idx], qty: (next[idx].qty || 1) + (Number(qty) || 1) };
      } else {
        next.push({
          product: productId,
          name,
          price: Number(price || 0),
          image,
          size: size || null,
          qty: Number(qty) || 1,
          customSize: customSize || null,
          extra: Number(parsedExtra || 0),
          lining: lining || null,
        });
      }
      return next;
    });
  };

  // Set quantity per product + size (+ optional customSize + optional extra + lining)
  const setQty = (product, size, qty, customSize = null, extra = null, lining = null) => {
    const productId = typeof product === "object" ? product._id : product;
    setItems((prev) =>
      prev.map((it) =>
        it.product === productId &&
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
    const productId = typeof product === "object" ? product._id : product;

    setItems((prev) =>
      prev.filter(
        (it) =>
          !(
            it.product === productId &&
            (it.size || null) === (size || null) &&
            (customSize ? sameCustom(it.customSize, customSize) : true) &&
            (extra !== null ? Number(it.extra || 0) === Number(extra || 0) : true) &&
            (lining !== null ? (it.lining || null) === (lining || null) : true)
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
