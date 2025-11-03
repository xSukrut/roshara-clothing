import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: "" },
    image:       { type: String, default: "" }, // <-- IMPORTANT
  },
  { timestamps: true }
);

export default mongoose.model("Collection", collectionSchema);
