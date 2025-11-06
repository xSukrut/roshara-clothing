// models/orderModel.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // price per unit at time of order
  extra: { type: Number, default: 0 }, // surcharge per unit (e.g. XL fee)
});

const upiSchema = new mongoose.Schema(
  {
    txnId: String,
    submittedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderItems: [orderItemSchema],
    shippingAddress: {
      address: String,
      city: String,
      postalCode: String,
      country: String,
    },
    codFee: { type: Number, default: 0},
    paymentMethod: { type: String, required: true }, // "upi", "cod", etc.
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },
    taxPrice: { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    itemsPrice: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },

    // NEW: keep main status + payment status in sync
    status: {
      type: String,
      enum: ["pending", "pending_verification", "paid", "shipped", "cancelled", "rejected"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "pending_verification", "paid", "rejected"],
      default: "pending",
    },

    upi: upiSchema,      
    adminNote: String,   

    paidAt: Date,
    shippedAt: Date,
  },
  { timestamps: true }
);

// Prevent OverwriteModelError when using hot-reload / nodemon
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
