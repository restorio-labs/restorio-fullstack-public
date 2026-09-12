/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@restorio/ui", "@restorio/types", "@restorio/auth", "@restorio/api-client"],
  experimental: {
    optimizePackageImports: ["@restorio/ui", "react-icons"],
  },
  async rewrites() {
    const target = process.env.NEXT_PUBLIC_API_PROXY_TARGET ?? (process.env.NODE_ENV === "production"
      ? "https://api.restorio.org"
      : "http://localhost:8000");

    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },
};

export default nextConfig;
