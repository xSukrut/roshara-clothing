// models/orderModel.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true }, // base product price (per unit)
    extra: { type: Number, default: 0 }, // server-calculated surcharge per unit (e.g., +200 for XL+)
    quantity: { type: Number, required: true, default: 1, min: 1 },
    size: { type: String, default: null },
    customSize: {
      // optional custom measurements object (may be null)
      bust: { type: String },
      waist: { type: String },
      hips: { type: String },
      shoulder: { type: String },
    },
  },
  { _id: false } // keep subdocs compact; main array will have its own ids via parent doc
);

const shippingAddressSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: "India" },
    phone: { type: String }, // optional
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    orderItems: {
      type: [orderItemSchema],
      required: true,
      default: [],
    },

    shippingAddress: { type: shippingAddressSchema },

    paymentMethod: { type: String, enum: ["cod", "upi", "card", "other"], default: "cod" },

    // numeric breakdown
    itemsPrice: { type: Number, required: true, default: 0 }, // includes extras
    discountAmount: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },

    // coupon applied (optional)
    couponCode: { type: String, default: null },

    // simple payment / order status tracking
    status: {
      type: String,
      enum: ["pending", "pending_verification", "paid", "shipped", "delivered", "rejected", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "pending_verification", "paid", "rejected"],
      default: "pending",
    },

    // UPI / payment proof
    upi: {
      txnId: { type: String },
      submittedAt: { type: Date },
      // you can add proofImage, notes, etc.
    },

    paid: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },

    // optional meta
    notes: { type: String },

    // keep a simple audit trail
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// useful index for admin search by user / createdAt
orderSchema.index({ user: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
