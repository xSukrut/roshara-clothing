// utils/img.js
// Builds a safe absolute URL for any image your backend returns.
// If NEXT_PUBLIC_API_URL is "https://api.roshara.in/api" -> BASE = "https://api.roshara.in"
const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")
  .replace(/\/$/, "")
  .replace(/\/api$/, "");

export function resolveImg(src) {
  if (!src) return "/placeholder.png";

  // Accept objects from various uploaders: { url, imageUrl, src, path, location, file }
  if (typeof src === "object" && src !== null) {
    src =
      src.url ||
      src.imageUrl ||
      src.src ||
      src.path ||
      src.location ||
      src.file ||
      "";
  }

  if (!src) return "/placeholder.png";
  if (/^https?:\/\//i.test(src)) return src; // already absolute (Cloudinary, etc.)

  // Ensure a leading slash and prefix with server base
  const path = src.startsWith("/") ? src : `/${src}`;
  return `${BASE}${path}`;
}
