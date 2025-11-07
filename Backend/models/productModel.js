import mongoose from "mongoose";
import { ROSHARA_SIZES } from "../constants/sizes.js";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    sizes: {
      type: [String],
      default: ROSHARA_SIZES,
    },
    colors: [String],
    images: [mongoose.Schema.Types.Mixed],
    stock: { type: Number, default: 0 },
    collection: { type: mongoose.Schema.Types.ObjectId, ref: "Collection" },
    isFeatured: { type: Boolean, default: false },
    discount: { type: Number, default: 0 },

    hasLiningOption: { type: Boolean, default: false },
    liningPrice: { type: Number, default: null },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
