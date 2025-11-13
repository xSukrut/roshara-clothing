// scripts/backfill-order-sizes.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import Order from "../models/orderModel.js";

dotenv.config();
const MONGO = process.env.MONGO_URI;
if (!MONGO) {
  console.error("MONGO_URI missing in .env");
  process.exit(1);
}

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");

function extractSize(it) {
  if (!it) return null;
  const candidates = [
    it.size,
    it.selectedSize,
    it.selected,
    it.selected_size,
    it.sizeLabel,
    it.selectedSizeLabel,
    it.chosenSize,
    it.size_label,
    it.sizeName,
    it.selectedSizeValue,
    it.sizeValue,
  ];
  for (const c of candidates) {
    if (c !== undefined && c !== null && String(c).trim() !== "") return String(c).trim();
  }
  if (it.customSize && it.customSize.label) return String(it.customSize.label).trim();
  if (it.product && typeof it.product === "object") {
    const p = it.product;
    if (p.selectedSize || p.size || p.defaultSize) return String(p.selectedSize || p.size || p.defaultSize).trim();
  }
  return null;
}

async function run() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to MongoDB");

  const cursor = Order.find({ "orderItems.size": { $in: [null, "", undefined] } }).cursor();

  let scanned = 0;
  let candidates = [];
  let applied = 0;

  for await (const order of cursor) {
    scanned++;
    let changed = false;
    for (const it of order.orderItems) {
      const hasEmpty = it.size === null || it.size === "" || it.size === undefined;
      if (!hasEmpty) continue;
      const guess = extractSize(it);
      if (guess) {
        candidates.push({ orderId: order._id.toString(), itemId: it._id ? it._id.toString() : null, from: it.size, to: guess });
        it.size = guess;
        changed = true;
      }
    }
    if (changed) {
      if (DRY) {
        // do not save
      } else {
        try {
          await order.save();
          applied++;
        } catch (e) {
          console.error("Failed saving order", order._id, e);
        }
      }
    }
  }

  console.log(`Scanned orders: ${scanned}`);
  console.log(`Candidate updates found: ${candidates.length}`);
  if (!DRY) console.log(`Applied updates: ${applied}`);
  console.log("Sample updates:", JSON.stringify(candidates.slice(0, 20), null, 2));

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});
