import Image from "next/image";

const images: Record<string, string> = {
  steel: "/images/catalog/tmt-bars.webp",
  cement: "/images/catalog/cement-sack.webp",
  "bricks-blocks": "/images/catalog/clay-bricks.webp",
  plumbing: "/images/catalog/pvc-pipe.webp",
  electrical: "/images/catalog/electrical-wiring.webp",
  aggregates: "/images/catalog/aggregates-samples.webp",
};

/** Real category sample photographs are never represented as an exact SKU or current stock. */
export function CatalogMaterialImage({ category, name, compact = false }: { category: string; name: string; compact?: boolean }) {
  const src = images[category];
  if (!src) return null;
  return <div className={compact ? "catalog-material-image compact" : "catalog-material-image"}>
    <Image src={src} alt={`Representative ${name} material photograph; actual supplied product may differ`} fill sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw" />
    <span className="catalog-image-note">Category sample · not an exact SKU</span>
  </div>;
}
