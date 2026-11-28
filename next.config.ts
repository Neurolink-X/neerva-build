import type { NextConfig } from "next";
import {canonicalRedirects} from "./src/modules/seo/site-origin";
import {publicIndexingEnabled} from "./src/modules/seo/indexing";
import {houseJourneyLocalPatterns} from "./src/modules/studio/house-journey";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Preserve query-free local images; allow only exact reviewed digest queries.
    localPatterns: [{pathname:"/**",search:""}, ...houseJourneyLocalPatterns],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/photo-**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/photos/**" },
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/wikipedia/commons/**" },
      { protocol: "https", hostname: "www.ultratechcement.com", pathname: "/content/dam/ultratechcementwebsite/media/ultratech_indi-27sno-1cement_hiresr1.jpg" },
    ],
  },
  // Keep the redirect direction consistent with the verified canonical host.
  redirects: async () => canonicalRedirects(process.env),
  headers: async () => [
    ...(!publicIndexingEnabled(process.env) ? [{source:"/:path*",headers:[{key:"X-Robots-Tag",value:"noindex, nofollow"}]}] : []),
    ...["/account","/admin","/dealer","/api","/basket","/quotes","/checkout","/orders","/my-project"].map(path=>({source:`${path}/:path*`,headers:[{key:"X-Robots-Tag",value:"noindex, nofollow"}]})),
    {source:"/sw.js",headers:[{key:"Cache-Control",value:"no-cache, max-age=0, must-revalidate"}]},
    // Approved catalog filenames are content-addressed; changed bytes require a new URL.
    {source:"/images/catalog/approved/:asset([a-f0-9]{24}[.]webp)",headers:[{key:"Cache-Control",value:"public, max-age=31536000, immutable"}]},
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
