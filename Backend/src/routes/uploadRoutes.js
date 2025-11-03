import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

// --------------------
// Cloudinary Configuration
// --------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --------------------
// Multer Memory Storage Config
// --------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (/^image\//i.test(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// --------------------
// Helper: upload buffer to Cloudinary
// --------------------
function uploadBufferToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "roshara",
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        filename_override:
          filename?.replace(/\.[^.]+$/, "")?.slice(0, 100) || "image",
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// --------------------
// POST /api/upload
// --------------------
router.post("/", upload.single("image"), async (req, res) => {
  try {
    // Accept 'image' or 'file' as form field
    const file =
      req.file ||
      (req.files && (req.files.image || req.files.file)) ||
      null;

    // Allow uploading via direct URL (for external imports)
    if (!file && req.body?.url) {
      const url = req.body.url.trim();
      return res.json({ url, imageUrl: url });
    }

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Clean up filename
    const filename =
      req.body?.filename ||
      file.originalname?.replace(/\s+/g, "_") ||
      "image.jpg";

    // Upload buffer to Cloudinary
    const result = await uploadBufferToCloudinary(file.buffer, filename);

    // Send consistent response
    return res.json({
      url: result.secure_url,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (err) {
    console.error("❌ Cloudinary upload error:", err);
    return res.status(500).json({
      message: "Upload failed",
      error: err?.message || "Unknown error",
    });
  }
});

export default router;
