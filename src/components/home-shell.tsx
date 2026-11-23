"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BasketLink } from "@/components/material-basket";
import type { CatalogCategory } from "@/modules/catalog/catalog";
import {generate} from "@/modules/studio/layout";
import { searchCategories } from "@/modules/catalog/catalog";
import { convertSquareFeet, squareFeetFromDimensions } from "@/modules/calculator/units";
import { QuoteRequestForm } from "@/components/quote-request-form";

const preview=generate({width:9144,depth:15240,beds:2,floors:1,road:"S",facing:"S",parking:true});
const icons: Record<CatalogCategory["icon"], string> = {
  steel: "‚ñ§", cement: "‚óà", brick: "‚ñ¶", pipe: "‚óâ", electric: "‚åÅ", aggregate: "‚óå",
};

const steps = ["Share your material list", "Dealers send itemized offers", "Compare the full delivered cost"];

export function HomeShell({ categories }: { categories: CatalogCategory[] }) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("Kanpur");
  const [length, setLength] = useState("20");
  const [width, setWidth] = useState("40");
  const [unit, setUnit] = useState<"ft" | "m">("ft");
  const results = useMemo(() => searchCategories(query, categories), [query, categories]);
  const calculation = useMemo(() => {
    try {
      return { area: convertSquareFeet(squareFeetFromDimensions(Number(length), Number(width), unit)), error: "" };
    } catch {
      return { area: null, error: "Enter positive plot dimensions." };
∂ªßq´^