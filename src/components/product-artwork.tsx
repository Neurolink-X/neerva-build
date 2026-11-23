import Image from "next/image";
import type { ReactNode } from "react";

const productPhotos: Record<string, { src: string; alt: string }> = {
  steel: { src: "/images/catalog/tmt-bars.webp", alt: "Illustrative unbranded ribbed TMT steel bars" },
  cement: { src: "/images/catalog/cement-sack.webp", alt: "Illustrative unbranded construction cement sack" },
  "bricks-blocks": { src: "/images/catalog/clay-bricks.webp", alt: "Illustrative red clay construction bricks" },
  plumbing: { src: "/images/catalog/pvc-pipe.webp", alt: "Illustrative cream PVC pipe and elbow fitting" },
  electrical: { src: "/images/catalog/electrical-wiring.webp", alt: "Illustrative red and black electrical wires, conduit, modular switch and breaker" },
  aggregates: { src: "/images/catalog/aggregates-samples.webp", alt: "Illustrative sand, crushed stone and gravel samples" },
};

const palette: Record<string, { base: string; shade: string; accent: string; label: string }> = {
  steel: { base: "#8f9b96", shade: "#56655f", accent: "#c6d2cf", label: "TMT steel" },
  cement: { base: "#d7c49e", shade: "#aa936d", accent: "#f3ead8", label: "cement bag" },
  "bricks-blocks": { base: "#c98661", shade: "#985e43", accent: "#e6b08d", label: "brick and block" },
  plumbing: { base: "#d2d9d4", shade: "#87988f", accent: "#a9cbc8", label: "pipe fitting" },
  electrical: { base: "#cb5745", shade: "#812f2a", accent: "#e5c15f", label: "electrical cable" },
  aggregates: { base: "#b29c7e", shade: "#89785e", accent: "#d8c7a9¶»§q«^