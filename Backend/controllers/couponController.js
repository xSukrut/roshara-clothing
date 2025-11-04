// controllers/couponController.js
import Coupon from "../models/couponModel.js";
import User from "../models/userModel.js"; 

// helper: check follower relation
async function isFollower(influencerId, userId) {
  if (!influencerId || !userId) return false;

  try {
    const [user, influencer] = await Promise.all([
      User.findById(userId).select("following"),
      User.findById(influencerId).select("followers"),
    ]);

    if (user && Array.isArray(user.following)) {
      if (user.following.some((id) => String(id) === String(influencerId))) return true;
    }

    if (influencer && Array.isArray(influencer.followers)) {
      if (influencer.followers.some((id) => String(id) === String(userId))) return true;
    }

    return false;
  } catch (err) {
    console.error("isFollower check failed:", err);
    return false;
  }
}

export const getActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      special: { $ne: true }, 
      active: true,
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

// ADMIN: list all
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    console.error("getAllCoupons error:", err);
    res.status(500).json({ message: "Failed to load coupons" });
  }
};

// ADMIN: create
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
      influencer: influencer || null,
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

// ADMIN: update
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
        else if (f === "influencer") c.influencer = req.body[f] || null;
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

// ADMIN: delete
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
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Coupon code required" });

    const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim() });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    // basic checks: active & expiry
    if (!coupon.active) return res.status(400).json({ message: "Coupon not active" });

    if (coupon.expiryDate && coupon.expiryDate < new Date()) {
      return res.status(400).json({ message: "Coupon expired" });
    }

    if (coupon.special) {
      if (!req.user || !req.user._id) {
        return res.status(401).json({ message: "Authentication required to use this coupon" });
      }

      if (coupon.influencer) {
        const allowed = await isFollower(coupon.influencer, req.user._id);
        if (!allowed) {
          return res.status(403).json({ message: "This coupon is restricted to influencer followers" });
        }
      } else {
      
        return res.status(403).json({ message: "Special coupon not usable" });
      }
    }

    if (coupon.special) {
      coupon.specialUseCount = (coupon.specialUseCount || 0) + 1;
      await coupon.save();
    }

    res.json(coupon);
  } catch (err) {
    console.error("redeemCoupon error:", err);
    res.status(500).json({ message: "Failed to redeem coupon" });
  }
};
