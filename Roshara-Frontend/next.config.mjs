import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "roshara-clothing.onrender.com" },
      { protocol: "https", hostname: "roshara.in" },
      { protocol: "https", hostname: "www.roshara.in" },
      // add cloud/CDN hosts later if needed
    ],
  },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "./"),
      "@components": path.resolve(__dirname, "./app/components"),
      "@services": path.resolve(__dirname, "./services"),
      "@context": path.resolve(__dirname, "./context"),
    };
    return config;
  },
};

export default nextConfig;
