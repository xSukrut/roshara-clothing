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

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set. Create Backend/.env");
  process.exit(1);
}

const app = express();

/** ---- CORS ---- */
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
const allowedOrigins = [
  "https://roshara.in",
  "https://www.roshara.in",
  FRONTEND_URL,              // e.g. http://localhost:3000 or deployed FE
  /\.vercel\.app$/,          // Vercel previews
  /\.onrender\.com$/,        // Render subdomains
];

// CORS options that allow localhost + your prod domains
const corsOptions = {
  origin(origin, cb) {
    // Allow non-browser clients (no Origin) like curl / health checks
    if (!origin) return cb(null, true);

    const ok =
      allowedOrigins.some((o) => (o instanceof RegExp ? o.test(origin) : o === origin)) ||
      /^https?:\/\/localhost(?::\d+)?$/i.test(origin) ||
      /^https?:\/\/127\.0\.0\.1(?::\d+)?$/i.test(origin);

    if (ok) return cb(null, true);

    // In non-production, be lenient (useful for testing)
    if (process.env.NODE_ENV !== "production") {
      console.warn("CORS (dev): allowing origin", origin);
      return cb(null, true);
    }

    console.warn("🚫 Blocked by CORS:", origin);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
  optionsSuccessStatus: 204,
};

// Apply CORS for all requests
app.use(cors(corsOptions));

// Handle ALL preflight requests without using app.options('*')
// (avoids path-to-regexp crash and still replies correctly)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    // When using credentials with CORS, echo back the request origin
    const origin = req.headers.origin;
    if (origin) res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    return res.sendStatus(204);
  }
  next();
});

/** ---- Parsers & static ---- */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/** ---- DB ---- */
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

/** ---- Routes ---- */
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

export default app;
