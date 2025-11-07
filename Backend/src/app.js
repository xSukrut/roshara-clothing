// src/app.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { notFound, errorHandler } from "../middleware/errorMiddleware.js";

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set. Create Backend/.env");
  process.exit(1);
}

const app = express();

const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

const allowedOrigins = [
  "https://roshara.in",
  "https://www.roshara.in",
  FRONTEND_URL,
  /\.vercel\.app$/,
  /\.onrender\.com$/,
  "http://localhost:3000",
];

function devAllowOrigin(origin) {
  if (!origin) return true;
  if (/^https?:\/\/localhost(?::\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin)) return true;
  return false;
}

const corsOptions = {
  origin(origin, cb) {
    // allow server-to-server / non-browser requests (origin === undefined)
    if (!origin) return cb(null, true);

    const ok = allowedOrigins.some((o) =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );

    if (ok || (process.env.NODE_ENV !== "production" && devAllowOrigin(origin))) {
      return cb(null, true); // allow
    }

    // Deny: do NOT throw an error here — return false so cors middleware responds cleanly.
    console.warn("🚫 Blocked by CORS (origin):", origin);
    return cb(null, false);
  },
  credentials: true, // set true if browser will send cookies; otherwise set false
  methods: ["GET","HEAD","PUT","PATCH","POST","DELETE","OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  optionsSuccessStatus: 204,
};

// explicitly handle preflight with cors middleware
app.options("/*", cors(corsOptions));

// apply CORS for all routes
app.use(cors(corsOptions));

// ----------------
// request body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// OPTIONAL: helpful logging middleware to show origin of incoming requests (remove in prod if noisy)
app.use((req, res, next) => {
  const origin = req.get("Origin") || "-";
  // Only log suspicious origins or in non-prod
  if (process.env.NODE_ENV !== "production" && origin !== "-") {
    console.log(`[CORS] ${req.method} ${req.path} — Origin: ${origin}`);
  }
  next();
});

// DB connect
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/health", (req, res) => res.status(200).json({ ok: true }));
app.get("/", (req, res) => {
  res.send("API is running...");
});

// 404 handler
app.use(notFound);
// centralized error handler -> sends JSON
app.use(errorHandler);

export default app;
