"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { AddToMaterialList } from "@/components/material-basket";
import { ProductArtwork } from "@/components/product-artwork";
import type { DemoProduct } from "@/modules/catalog/marketplace";
import type { CatalogCategory } from "@/modules/catalog/catalog";

const defaultUnit: Record<string, string> = { steel: "kg", cement: "bag", "bricks-blocks": "piece", plumbing: "length", electrical: "coil", aggregates: "truck" };

export function MaterialsBrowser({ products, categories, initialQuery = "", initialCategory = "all" }: { products: DemoProduct[]; categories: CatalogCategory[]; initialQuery?: string; initialCategory?: string }) {
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState("all");
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState("relevance");
  const [city, setCity] = useState(() => {
    const available = [...new Set(products.flatMap((item) => item.priceOffers?.map((offer) => offer.city) ?? []))].sort();
    return available.find((item) => item.trim().toLowerCase().includes("kanpur")) ?? available[0] ?? "kanpur";
  });
  const brands = useMemo(() => [...new Set(products.filter((item) => category === "all" || item.category === category).map((item) => item.brand))].sort(), [products, category]);
  const pricedCities = useMemo(() => [...new Set(products.flatMap((item)¶»§q«^