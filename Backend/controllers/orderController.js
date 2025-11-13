// controllers/orderController.js
import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Coupon from "../models/couponModel.js";
import User from "../models/userModel.js";

// surcharge rule (server-side source of truth)
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
    const bust = custom.bust ? Number(custom.bust) : null;
    const waist = custom.waist ? Number(custom.waist) : null;
    const hips = custom.hips ? Number(custom.hips) : null;
    const shoulder = custom.shoulder ? Number(custom.shoulder) : null;

    if (bust !== null && !Number.isNaN(bust) && bust > XL_THRESHOLDS.bust) return true;
    if (waist !== null && !Number.isNaN(waist) && waist > XL_THRESHOLDS.waist) return true;
    if (hips !== null && !Number.isNaN(hips) && hips > XL_THRESHOLDS.hips) return true;
    if (shoulder !== null && !Number.isNaN(shoulder) && shoulder > XL_THRESHOLDS.shoulder) return true;

    return false;
  } catch {
    return false;
  }
}

/**
 * Extract a size value from a potentially messy orderItem object.
 * Looks into several common aliases and into a nested product object (if present).
 * Returns null if nothing found.
 */
function extractSizeFromItem(item) {
  if (!item || typeof item !== "object") return null;

  // Candidate keys to check (expandable)
  const candidates = [
    "size",
    "selectedSize",
    "selected_size",
    "selected",
    "sizeLabel",
    "selectedSizeLabel",
    "chosenSize",
    "size_label",
    "sizeName",
    "selectedSizeValue",
    "variant",
  ];

  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(item, key)) {
      const v = item[key];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
    }
  }

  // If product subdocument was included with a chosen size
  if (item.product && typeof item.product === "object") {
    const p = item.product;
    const pCandidates = ["selectedSize", "size", "defaultSize", "sizeLabel"];
    for (const k of pCandidates) {
      if (Object.prototype.hasOwnProperty.call(p, k)) {
        const v = p[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
      }
    }
  }

  return null;
}

/**
 * Normalize and extract customSize object if present under multiple aliases.
 * Returns a normalized object { bust, waist, hips, shoulder } or null.
 */
function extractCustomSizeObject(item) {
  if (!item || typeof item !== "object") return null;

  const aliases = ["customSize", "custom", "measurements", "customMeasurements", "custom_size", "measurement"];
  let cand = null;
  for (const a of aliases) {
    if (Object.prototype.hasOwnProperty.call(item, a) && item[a] != null) {
      cand = item[a];
      break;
    }
  }

  if (!cand && item.product && typeof item.product === "object") {
    // sometimes frontend sent full product-with-chosen-measurements
    for (const a of aliases) {
      if (Object.prototype.hasOwnProperty.call(item.product, a) && item.product[a] != null) {
        cand = item.product[a];
        break;
      }
    }
  }

  if (!cand) return null;

  let obj = cand;
  if (typeof cand === "string") {
    // try parse JSON-ish string or "bust:36,waist:28"
    try {
      obj = JSON.parse(cand);
    } catch {
      const kv = {};
      cand.split(",").forEach((p) => {
        const [k, v] = p.split(":").map((s) => (s ? s.trim() : ""));
        if (k && v) kv[k] = v;
      });
      if (Object.keys(kv).length) obj = kv;
    }
  }

  const out = {
    bust: obj?.bust ? String(obj.bust).trim() : undefined,
    waist: obj?.waist ? String(obj.waist).trim() : undefined,
    hips: obj?.hips ? String(obj.hips).trim() : undefined,
    shoulder: obj?.shoulder ? String(obj.shoulder).trim() : undefined,
  };

  // return null if completely empty
  if (!out.bust && !out.waist && !out.hips && !out.shoulder) return null;
  return out;
}

export const createOrder = asyncHandler(async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      taxPrice = 0,
      shippingPrice = 0,
      couponCode = null,
    } = req.body || {};

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    // normalize product id & qty
    const orderItemsNorm = orderItems.map((it) => ({
      ...it,
      product: it.product || it._id || it.id,
      quantity: Number(it.quantity || it.qty || 1),
    }));

    // Validate items quickly
    for (const [i, item] of orderItemsNorm.entries()) {
      if (!item?.product) {
        return res.status(400).json({ message: `Missing product id for item #${i + 1}` });
      }
      if (!Number.isFinite(item.quantity) || Number(item.quantity) < 1) {
        return res.status(400).json({ message: `Invalid quantity for item #${i + 1}` });
      }
    }

    // compute items price and hydrate name/price
    let itemsPrice = 0;
    for (const item of orderItemsNorm) {
      const prod = await Product.findById(item.product);
      if (!prod) {
        return res.status(400).json({ message: `Product ${item.product} not found` });
      }

      const qty = Number(item.quantity || 1);

      // === Robust size extraction: prefer explicit size, else check aliases, else keep null ===
      const extractedSize = extractSizeFromItem(item);
      const customSizeFromItem = extractCustomSizeObject(item);

      // if frontend sent custom measurements fields (e.g., in different key), prefer normalized custom
      const customSize = customSizeFromItem || null;

      // determine extra (surcharge)
      const extra = isLargeSizeLabel(extractedSize) || isLargeByCustomMeasurements(customSize) ? SURCHARGE_FOR_XL_AND_ABOVE : 0;

      // unit price: apply lining choice only if product supports it
      let unitPrice = Number(prod.price);
      if (prod.hasLiningOption && String(item.lining || "").toLowerCase() === "with") {
        const lp = Number(prod.liningPrice);
        if (Number.isFinite(lp) && lp > 0) unitPrice = lp;
      }

      // hydrate fields for storage (server-side authoritative)
      item.name = prod.name;
      item.price = Number(unitPrice);
      item.extra = Number(extra);
      item.lining = prod.hasLiningOption ? (String(item.lining || "").toLowerCase() === "with" ? "with" : "without") : null;

      // ensure size and image are stored (normalize)
      item.size = extractedSize || null;
      item.image = (prod.images && prod.images.length ? prod.images[0] : (prod.image || item.image || "")) || "";

      if (customSize) {
        item.customSize = {
          bust: customSize.bust ? String(customSize.bust).trim() : undefined,
          waist: customSize.waist ? String(customSize.waist).trim() : undefined,
          hips: customSize.hips ? String(customSize.hips).trim() : undefined,
          shoulder: customSize.shoulder ? String(customSize.shoulder).trim() : undefined,
        };
      } else {
        item.customSize = null;
      }

      itemsPrice += (Number(unitPrice) + Number(extra)) * qty;
    }

    // Coupon logic
    let discountAmount = 0;
    let coupon = null;

    if (couponCode) {
      const code = String(couponCode || "").trim().toUpperCase();
      if (!code) {
        return res.status(400).json({ message: "Invalid coupon code" });
      }

      coupon = await Coupon.findOne({ code, active: true });
      if (!coupon) return res.status(400).json({ message: "Invalid or inactive coupon" });

      if (coupon.expiryDate && coupon.expiryDate < new Date()) {
        return res.status(400).json({ message: "Coupon expired" });
      }

      if (coupon.usageLimit > 0 && (coupon.usedCount || 0) >= coupon.usageLimit) {
        return res.status(400).json({ message: "Coupon usage limit reached" });
      }

      if (itemsPrice < (coupon.minOrderAmount || 0)) {
        return res.status(400).json({
          message: `Minimum order amount for coupon is ₹${coupon.minOrderAmount}`,
        });
      }

      if (coupon.discountType === "percentage") {
        discountAmount = Math.round((itemsPrice * coupon.value) / 100);
      } else {
        discountAmount = Number(coupon.value || 0);
      }
      if (discountAmount > itemsPrice) discountAmount = itemsPrice;
    }

    // COD fee
    const codFee = String(paymentMethod || "").toLowerCase() === "cod" ? 90 : 0;

    const totalPrice =
      Number(itemsPrice || 0) - Number(discountAmount || 0) + Number(shippingPrice || 0) + Number(taxPrice || 0) + Number(codFee || 0);

    const order = new Order({
      user: req.user?._id,
      orderItems: orderItemsNorm,
      shippingAddress,
      paymentMethod,
      taxPrice,
      shippingPrice,
      itemsPrice,
      discountAmount,
      totalPrice,
      status: "pending",
      paymentStatus: "pending",
      upi: {},
      couponCode: coupon ? coupon.code : null,
      codFee: codFee,
      isPaid: false,
    });

    const created = await order.save();

    if (coupon) {
      try {
        if (coupon.special) {
          await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } }, { new: true });
        }
      } catch (incErr) {
        console.error("Failed to increment coupon usedCount:", incErr);
      }
    }

    res.status(201).json(created);
  } catch (err) {
    console.error("createOrder - unexpected error:", err && err.stack ? err.stack : err);
    res.status(500).json({ message: "Server error while creating order", detail: String(err?.message || err) });
  }
});

export const submitUpiProof = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const txnId = (req.body?.transactionId || req.body?.txnId || "").toString().trim();

  if (!txnId) return res.status(400).json({ message: "Transaction ID required" });

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (String(order.user) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  order.upi = order.upi || {};
  order.upi.txnId = txnId;
  order.upi.submittedAt = new Date();

  order.paymentStatus = "pending_verification";
  order.status = "pending_verification";

  const updated = await order.save();
  res.json(updated);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    // populate product reference information inside orderItems
    .populate({
      path: "orderItems.product",
      select: "name images price hasLiningOption liningPrice",
    });

  if (!order) return res.status(404).json({ message: "Order not found" });

  const isOwner = String(order.user?._id) === String(req.user._id);
  const isAdmin = req.user.role === "admin" || req.user.isAdmin;
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "Not authorized to view this order" });
  }
  res.json(order);
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 })
    .populate({
      path: "orderItems.product",
      select: "name images price hasLiningOption liningPrice",
    });
  res.json(orders);
});

export const adminListOrders = asyncHandler(async (req, res) => {
  if (!req.user || !(req.user.isAdmin || req.user.role === "admin")) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { q = "", status = "" } = req.query;

  const filter = {};
  if (status) {
    filter.$or = [{ paymentStatus: status }, { status }];
  }

  let userIds = [];
  if (q) {
    const users = await User.find({
      $or: [{ email: { $regex: q, $options: "i" } }, { name: { $regex: q, $options: "i" } }],
    }).select("_id");
    userIds = users.map((u) => u._id);
  }

  const idOr = [];
  if (q) {
    idOr.push({ _id: q });
    idOr.push({ _id: { $regex: q, $options: "i" } });
    if (userIds.length) idOr.push({ user: { $in: userIds } });
    filter.$or = filter.$or ? [...filter.$or, ...idOr] : idOr;
  }

  // Populate user and the product inside orderItems so frontend can access product.name/images etc.
  const orders = await Order.find(filter)
    .populate("user", "name email")
    .populate({
      path: "orderItems.product",
      select: "name images price hasLiningOption liningPrice",
    })
    .sort({ createdAt: -1 });

  res.json(orders);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "paid" | "rejected" | "pending_verification"

    const allowed = ["pending_verification", "paid", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    order.paymentStatus = status;

    if (status === "paid") {
      order.isPaid = true;
      order.paidAt = new Date();
    } else {
      order.isPaid = false;
      order.paidAt = null;
    }

    const saved = await order.save();
    // return updated with populated product/user for convenience
    const populated = await Order.findById(saved._id)
      .populate("user", "name email")
      .populate({
        path: "orderItems.product",
        select: "name images price hasLiningOption liningPrice",
      });
    res.json(populated);
  } catch (e) {
    console.error("updateOrderStatus error:", e);
    res.status(500).json({ message: "Server error updating order" });
  }
});
