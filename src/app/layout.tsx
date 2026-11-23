import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./typography.css";
import {InstallExperience} from "@/components/install-experience";
import {publicIndexingEnabled} from "@/modules/seo/indexing";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const isIndexable = publicIndexingEnabled(process.env);

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "NEERVA BUILD — Construction Materials & Home Planning", template: "%s | NEERVA BUILD" },
  description: "Compare construction material specifications, request private dealer quotations and plan your home with NEERVA BUILD. Starting in Kanpur, open to other cities.",
  applicationName: "NEERVA BUILD",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "NEERVA BUILD",
    title: "Build better. Buy smarter.",
    description: "Compare construction material specifications, request private dealer quotations and plan your home.",
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "NEERVA BUILD — Build better. Buy smarter.", description: "Construction materials, dealer quotations and home planning in one place." },
  // Keep pre-launch builds out of search until catalog, pricing and enquiry
  // operations are backed by verified production data.
  robots: { index: isIndexable, follow: isIndexable },
};

export const viewport: Viewport = { themeColor: "#f5f4ef", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-IN"><body>{children}<InstallExperience/></body></html>;
}
