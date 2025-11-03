import path from "path";

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "roshara-clothing.onrender.com" },
      { protocol: "https", hostname: "roshara.in" },
      { protocol: "https", hostname: "www.roshara.in" },
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
