// models/couponModel.js
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    discountType: {
      type: String,
      enum: ["percentage", "amount"],
      default: "percentage",
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiryDate: {
      type: Date,
    },
    active: {
      type: Boolean,
      default: true,
    },

    // --- New fields for special/influencer coupons ---
    special: {
      type: Boolean,
      default: false, // true for influencer/private coupons
    },
    influencer: {
      type: String,
      default: "", // store influencer identifier (username or userId)
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
