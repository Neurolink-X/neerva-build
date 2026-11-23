"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AddToMaterialList } from "@/components/material-basket";
import { ProductArtwork } from "@/components/product-artwork";
import type { DemoProduct } from "@/modules/catalog/marketplace";

export function ProductGallery({ product }: { product: DemoProduct }) {
  const [active, setActive] = useState(0);
  const hasSupplierImages = Boolean(product.images?.length);
  const imageAt = (index: number) => product.images?.[index];
  const galleryItems: { label: string; scene: "catalog"; imageIndex?: number }[] = hasSupplierImages
    ? product.images!.map((_, index) => ({ label: `Supplier image ${index + 1}`, scene: "catalog" as const, imageIndex: index }))
    : [{ label: "Illustrative material image", scene: "catalog" as const }];
  const activeItem = galleryItems[Math.min(active, galleryItems.length - 1)] ?? galleryItems[0];
  return (
    <div className="product-gallery">
      <div className="product-gallery-stage">
        {activeItem.imageIndex !== undefined && imageAt(activeItem.imageIndex) ? <Image className="catalog-real-image" src={imageAt(activeItem.imageIndex)!} alt={`${product.name} dealer supplied product image ${activeItem.imageIndex + 1}`} fill sizes="(max-width: 680px) 100vw, 50vw" unoptimized /> : <ProductArtwork category={product.category} scene={activeItem.scene} />}
        <span className="gallery-disclaimer">{hasSupplierImages ? ¶»§q«^