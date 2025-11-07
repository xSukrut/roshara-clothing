// controllers/orderController.js
import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Coupon from "../models/couponModel.js";
import User from "../models/userModel.js";

// surcharge rule (server-side source of truth)
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

export const createOrder = asyncHandler(async (req, res) => {
  try {
    console.log(">>> createOrder called -", new Date().toISOString());
    console.log("User present:", !!req.user, req.user && { id: req.user._id, email: req.user.email });
    try {
      console.log("Payload (trim):", JSON.stringify(req.body).slice(0, 2000));
    } catch (e) {}

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
        console.warn("createOrder: missing product id at index", i, item);
        return res.status(400).json({ message: `Missing product id for item #${i + 1}` });
      }
      if (!Number.isFinite(item.quantity) || Number(item.quantity) < 1) {
        console.warn("createOrder: invalid qty at index", i, item);
        return res.status(400).json({ message: `Invalid quantity for item #${i + 1}` });
      }
    }

    // compute items price and hydrate name/price
    // IMPORTANT: server decides 'extra' and price based on product and requested lining (do not trust client)
    let itemsPrice = 0;
    for (const [idx, item] of orderItemsNorm.entries()) {
      console.log(`Processing item ${idx}: product=${item.product} size=${item.size} qty=${item.quantity} lining=${item.lining}`);
      const prod = await Product.findById(item.product);
      if (!prod) {
        console.error("createOrder: Product not found", item.product);
        return res.status(400).json({ message: `Product ${item.product} not found` });
      }

      const qty = Number(item.quantity || 1);
      const size = item.size || null;
      const extra = isLargeSizeLabel(size) ? SURCHARGE_FOR_XL_AND_ABOVE : 0;

      // Determine unit price server-side:
      // If product supports lining and customer requested lining === 'with' use product.liningPrice.
      // Otherwise use product.price.
      let unitPrice = Number(prod.price);
      if (prod.hasLiningOption && String(item.lining || "").toLowerCase() === "with") {
        // protect: fallback to prod.price if liningPrice absent or invalid
        const lp = Number(prod.liningPrice);
        if (Number.isFinite(lp) && lp > 0) unitPrice = lp;
      }

      // hydrate item fields saved to DB
      item.name = prod.name;
      item.price = Number(unitPrice); // unit price saved
      item.extra = Number(extra);
      // keep lining metadata
      item.lining = prod.hasLiningOption ? (String(item.lining || "").toLowerCase() === "with" ? "with" : "without") : null;

      // accumulate itemsPrice (price + surcharge) * qty
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
    });

    const created = await order.save();

    if (coupon) {
      try {
        if (coupon.special) {
          await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } }, { new: true });
        } else {
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
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) return res.status(404).json({ message: "Order not found" });

  const isOwner = String(order.user?._id) === String(req.user._id);
  const isAdmin = req.user.role === "admin" || req.user.isAdmin;
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "Not authorized to view this order" });
  }
  res.json(order);
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
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

  const orders = await Order.find(filter).populate("user", "name email").sort({ createdAt: -1 });

  res.json(orders);
});

export const updateOrderStatus = async (req, res) => {
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
      order.paid = true;
      order.paidAt = new Date();
    } else {
      order.paid = false;
      order.paidAt = null;
    }

    const saved = await order.save();
    res.json(saved);
  } catch (e) {
    console.error("updateOrderStatus error:", e);
    res.status(500).json({ message: "Server error updating order" });
  }
};
