import type { NextConfig } from "next";
import {customDomainCutoverReady} from "./src/modules/seo/site-origin";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/photo-**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/photos/**" },
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/wikipedia/commons/**" },
      { protocol: "https", hostname: "www.ultratechcement.com", pathname: "/content/dam/ultratechcementwebsite/media/ultratech_indi-27sno-1cement_hiresr1.jpg" },
    ],
  },
  // Redirect only after both hostnames are moved, HTTPS is confirmed and the
  // operator explicitly enables the hostname cutover. No redirect loop.
  redirects: async () => customDomainCutoverReady(process.env) ? [
    {source:"/:path*",has:[{type:"host" as const,value:"neerva-build.vercel.app"}],destination:"https://neerva.in/:path*",permanent:true},
    {source:"/:path*",has:[{type:"host" as const,value:"www.neerva.in"}],destination:"https://neerva.in/:path*",permanent:true}
  ] : [],
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Strict-Transport-Security", value: "max-age=15552000" },
        { key: "Content-Security-Policy", value: "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" },
        { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ],
};

export default nextConfig;
