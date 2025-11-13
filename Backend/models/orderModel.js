// backend: models/orderModel.js
import mongoose from "mongoose";

const customSizeSchema = new mongoose.Schema(
  {
    bust: { type: String },
    waist: { type: String },
    hips: { type: String },
    shoulder: { type: String },
    label: { type: String }, // optional label if some clients stored a label here
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  image: { type: String },
  size: { type: String, default: null },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  extra: { type: Number, default: 0 },
  customSize: { type: customSizeSchema, default: null },
  lining: { type: String, enum: ["with", "without", null], default: null },
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
    codFee: { type: Number, default: 0 },
    paymentMethod: { type: String, required: true },
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

    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    shippedAt: Date,
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
