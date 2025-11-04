// controllers/couponController.js
import Coupon from "../models/couponModel.js";


export const getActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      active: true,
      special: { $ne: true }, // exclude special coupons from public list
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: now } },
      ],
    }).sort({ createdAt: -1 });

    res.json(coupons);
  } catch (err) {
    console.error("getActiveCoupons error:", err);
    res.status(500).json({ message: "Failed to fetch active coupons" });
  }
};

// Admin: list all (including special)
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    console.error("getAllCoupons error:", err);
    res.status(500).json({ message: "Failed to load coupons" });
  }
};

// Admin: create
export const createCoupon = async (req, res) => {
  try {
    let {
      code,
      description = "",
      discountType = "percentage",
      value,
      minOrderAmount = 0,
      maxDiscount = 0,
      expiryDate,
      active = true,
      special = false,
      influencer = null,
    } = req.body;

    if (!code || value === undefined || value === null) {
      return res.status(400).json({ message: "Code and value are required" });
    }

    code = String(code).toUpperCase().trim();
    discountType = discountType === "amount" ? "amount" : "percentage";

    const exists = await Coupon.findOne({ code });
    if (exists) {
      return res.status(400).json({ message: "Coupon already exists" });
    }

    const coupon = await Coupon.create({
      code,
      description,
      discountType,
      value: Number(value),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscount: Number(maxDiscount) || 0,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      active: !!active,
      special: !!special,
      influencer: influencer ? String(influencer) : null,
    });

    res.status(201).json(coupon);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Coupon code must be unique" });
    }
    console.error("createCoupon error:", err);
    res.status(500).json({ message: "Failed to create coupon" });
  }
};

// Admin: update
export const updateCoupon = async (req, res) => {
  try {
    const c = await Coupon.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Coupon not found" });

    const fields = [
      "code",
      "description",
      "discountType",
      "value",
      "minOrderAmount",
      "maxDiscount",
      "expiryDate",
      "active",
      "special",
      "influencer",
    ];

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (f === "code") c.code = String(req.body[f]).toUpperCase().trim();
        else if (f === "discountType")
          c.discountType = req.body[f] === "amount" ? "amount" : "percentage";
        else if (["value", "minOrderAmount", "maxDiscount"].includes(f))
          c[f] = Number(req.body[f]) || 0;
        else if (f === "expiryDate") c.expiryDate = req.body[f] ? new Date(req.body[f]) : null;
        else if (f === "active") c.active = !!req.body[f];
        else if (f === "special") c.special = !!req.body[f];
        else if (f === "influencer") c.influencer = req.body[f] ? String(req.body[f]) : null;
        else c[f] = req.body[f];
      }
    }

    const saved = await c.save();
    res.json(saved);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ message: "Coupon code must be unique" });
    }
    console.error("updateCoupon error:", err);
    res.status(500).json({ message: "Failed to update coupon" });
  }
};

// Admin: delete
export const deleteCoupon = async (req, res) => {
  try {
    const c = await Coupon.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Coupon not found" });
    await c.deleteOne();
    res.json({ message: "Coupon deleted" });
  } catch (err) {
    console.error("deleteCoupon error:", err);
    res.status(500).json({ message: "Failed to delete coupon" });
  }
};

export const redeemCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return res.status(400).json({ message: "Coupon code required" });

    const now = new Date();
    const upper = String(code).toUpperCase().trim();

    // Find the coupon
    const coupon = await Coupon.findOne({ code: upper });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    if (!coupon.active) return res.status(400).json({ message: "Coupon is not active" });

    if (coupon.expiryDate && coupon.expiryDate < now) {
      return res.status(400).json({ message: "Coupon has expired" });
    }


    if (orderAmount !== undefined && Number(coupon.minOrderAmount || 0) > Number(orderAmount || 0)) {
      return res.status(400).json({ message: `Minimum order amount ₹${coupon.minOrderAmount} required` });
    }


    const updated = await Coupon.findOneAndUpdate(
      { _id: coupon._id },
      { $inc: { usedCount: 1 } },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("redeemCoupon error:", err);
    res.status(500).json({ message: "Failed to redeem coupon" });
  }
};
