// controllers/orderController.js
import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Coupon from "../models/couponModel.js";
import User from "../models/userModel.js";

/**
 * Create order
 * - normalizes orderItems (product id + qty)
 * - computes item prices by reading Product
 * - validates coupon (if any)
 * - saves order
 * - increments coupon.usedCount **only if coupon.special === true** (atomic $inc)
 */
export const createOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    taxPrice = 0,
    shippingPrice = 0,
    couponCode = null,
  } = req.body;

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return res.status(400).json({ message: "No order items" });
  }

  // normalize product id & qty
  const orderItemsNorm = orderItems.map((it) => ({
    ...it,
    product: it.product || it._id || it.id,
    quantity: it.quantity || it.qty || 1,
  }));

  for (const [i, item] of orderItemsNorm.entries()) {
    if (!item?.product) {
      return res.status(400).json({ message: `Missing product id for item #${i + 1}` });
    }
  }

  // compute items price and hydrate name/price
  let itemsPrice = 0;
  for (const item of orderItemsNorm) {
    const prod = await Product.findById(item.product);
    if (!prod) return res.status(400).json({ message: `Product ${item.product} not found` });
    itemsPrice += Number(prod.price) * (item.quantity || 1);
    item.name = prod.name;
    item.price = prod.price;
  }

  // Coupon logic (ROSHARA10 = 10% above 1899)
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

    // optional usageLimit handling (if you have usageLimit field)
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
      discountAmount = coupon.value;
    }
    if (discountAmount > itemsPrice) discountAmount = itemsPrice;
  }

  // COD fee
  const codFee = paymentMethod === "cod" ? 90 : 0;

  const totalPrice = itemsPrice - discountAmount + shippingPrice + taxPrice + codFee;

  const order = new Order({
    user: req.user._id,
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
    couponCode: coupon ? coupon.code : null, // store applied coupon code (optional helpful)
  });

  const created = await order.save();

  // Atomically increment usedCount **only for special coupons**
  // (we do not fail the order if the coupon increment fails — just log)
  if (coupon) {
    try {
      if (coupon.special) {
        await Coupon.findByIdAndUpdate(
          coupon._id,
          { $inc: { usedCount: 1 } },
          { new: true } // not strictly needed, but ok
        );
      } else {
        // If you want to track total uses for all coupons, uncomment below:
        // await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
      }
    } catch (incErr) {
      console.error("Failed to increment coupon usedCount:", incErr);
      // don't abort order — coupon count failure shouldn't block checkout
    }
  }

  res.status(201).json(created);
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
      $or: [
        { email: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ],
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

  const orders = await Order.find(filter)
    .populate("user", "name email")
    .sort({ createdAt: -1 });

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
