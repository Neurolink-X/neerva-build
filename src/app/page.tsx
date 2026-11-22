import { HomeShell } from "@/components/home-shell";
import { catalogCategories } from "@/modules/catalog/catalog";

export default function HomePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NEERVA BUILD",
    url: siteUrl,
    description: "Construction material discovery, dealer quotations and home planning.",
    areaServed: { "@type": "Country", name: "India" },
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <HomeShell categories={catalogCategories} />
  </>;
}
