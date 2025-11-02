// Roshara-Frontend/next.config.mjs
import path from "path";

const nextConfig = {
  images: {
    remotePatterns: [
      // backend on Render
      { protocol: "https", hostname: "roshara-clothing.onrender.com" },
      // your domain(s)
      { protocol: "https", hostname: "roshara.in" },
      { protocol: "https", hostname: "www.roshara.in" },
      // (optional) Cloudinary if you use it later
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  webpack: (config) => {
    // Path aliases to match your jsconfig.json
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(process.cwd(), "Roshara-Frontend"),
      "@components": path.resolve(process.cwd(), "Roshara-Frontend/app/components"),
      "@services": path.resolve(process.cwd(), "Roshara-Frontend/services"),
      "@context": path.resolve(process.cwd(), "Roshara-Frontend/context"),
    };
    return config;
  },
};

export default nextConfig;

