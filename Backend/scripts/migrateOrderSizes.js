// scripts/migrateOrderSizes.js
// Run: node scripts/migrateOrderSizes.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Order from "../models/orderModel.js"; // adjust relative path if needed

const MONGO = process.env.MONGO_URI || process.env.DATABASE_URL;
if (!MONGO) {
  console.error("Set MONGO_URI in env");
  process.exit(1);
}

async function extractSizeFromItem(item) {
  if (!item || typeof item !== "object") return null;
  const candidates = [
    "size",
    "selectedSize",
    "selected_size",
    "selected",
    "sizeLabel",
    "selectedSizeLabel",
    "chosenSize",
    "size_label",
    "sizeName",
    "selectedSizeValue",
    "variant",
  ];
  for (const k of candidates) {
    if (Object.prototype.hasOwnProperty.call(item, k)) {
      const v = item[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
    }
  }
  if (item.product && typeof item.product === "object") {
    const pCandidates = ["selectedSize", "size", "defaultSize", "sizeLabel"];
    for (const k of pCandidates) {
      if (Object.prototype.hasOwnProperty.call(item.product, k)) {
        const v = item.product[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
      }
    }
  }
  return null;
}

async function migrate() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to Mongo");

  const cursor = Order.find({}).cursor();
  let updated = 0;
  let scanned = 0;
  for await (const order of cursor) {
    let changed = false;
    if (!Array.isArray(order.orderItems)) continue;
    for (const it of order.orderItems) {
      scanned++;
      // if size already set, skip
      if (it.size && String(it.size).trim() !== "") continue;

      const extracted = await extractSizeFromItem(it);
      if (extracted) {
        it.size = extracted;
        changed = true;
      }
    }

    if (changed) {
      await order.save();
      updated++;
      console.log(`Updated order ${order._id}`);
    }
  }

  console.log(`Done. scanned=${scanned}, updatedOrders=${updated}`);
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
