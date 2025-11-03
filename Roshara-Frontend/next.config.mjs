// next.config.mjs
import path from "path";

const nextConfig = {
  images: {
    // Keep any loader defaults, just expand remotePatterns to include Cloudinary
    remotePatterns: [
      // your backend(s)
      { protocol: "https", hostname: "roshara-clothing.onrender.com" },
      { protocol: "https", hostname: "roshara.in" },
      { protocol: "https", hostname: "www.roshara.in" },

      // ✅ Cloudinary (secure URLs look like https://res.cloudinary.com/<cloud_name>/...)
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.join(process.cwd()),
      "@components": path.join(process.cwd(), "app/components"),
      "@services": path.join(process.cwd(), "services"),
      "@context": path.join(process.cwd(), "context"),
    };
    return config;
  },
};

export default nextConfig;
