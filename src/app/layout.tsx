import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "NEERVA BUILD | Build better. Buy smarter.", template: "%s | NEERVA BUILD" },
  description: "Compare construction materials, request transparent dealer quotations and plan your home with NEERVA BUILD.",
  applicationName: "NEERVA BUILD",
  openGraph: { type: "website", siteName: "NEERVA BUILD", title: "Build better. Buy smarter.", description: "Materials, quotations and home planning in one place." },
  robots: { index: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")), follow: true },
};

export const viewport: Viewport = { themeColor: "#f5f4ef", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
