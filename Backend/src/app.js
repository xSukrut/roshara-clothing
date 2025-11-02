// src/app.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js"; // <-- fixed case
import collectionRoutes from "./routes/collectionRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set. Create Backend/.env");
  process.exit(1);
}

const app = express();

/* -------------------- CORS -------------------- */
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const allowedOrigins = [
  "https://roshara.in",
  "https://www.roshara.in",
  FRONTEND_URL,        // e.g. https://roshara-clothing.vercel.app
  /\.vercel\.app$/,    // Vercel previews
  /\.onrender\.com$/,  // Render subdomains
];

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // SSR, curl, same-origin
    const ok = allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    return ok ? cb(null, true) : cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
// ❌ REMOVE this for Express 5: app.options("*", cors(corsOptions));
// If you really need it, use: app.options("(.*)", cors(corsOptions));

/* -------------------- Body / Static -------------------- */
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Optional: custom headers (CORS already sets most of these)
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

/* -------------------- Mongo -------------------- */
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

/* -------------------- Routes -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/upload", uploadRoutes);

/* -------------------- Health & Root -------------------- */
app.get("/health", (req, res) => res.status(200).json({ ok: true }));
app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;
