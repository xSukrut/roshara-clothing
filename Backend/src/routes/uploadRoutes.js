// Backend/src/routes/uploadRoutes.js
import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const upload = multer({ storage: multer.memoryStorage() });

function uploadBufferToCloudinary(buffer, folder = "roshara") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const file = req.file || (req.files && (req.files.image || req.files.file));
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const result = await uploadBufferToCloudinary(file.buffer, "roshara");

    return res.json({
      url: result.secure_url,       // primary (Cloudinary)
      imageUrl: result.secure_url,  // alias to keep old frontend working
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return res.status(500).json({ message: "Upload failed" });
  }
});
router.post("/file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const result = await uploadBufferToCloudinary(req.file.buffer, "roshara");
    return res.json({
      url: result.secure_url,
      imageUrl: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return res.status(500).json({ message: "Upload failed" });
  }
});

export default router;
