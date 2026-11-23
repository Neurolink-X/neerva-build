"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMaterialBasket } from "@/components/material-basket";
import { createNeervaBrowserClient } from "@/modules/supabase/browser";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const supabase = createNeervaBrowserClient();

export function QuoteRequestForm({ defaultCity, defaultCategory = "aggregates", defaultMaterial = "", includeBasket = false }: { defaultCity: string; defaultCategory?: string; defaultMaterial?: string; includeBasket?: boolean }) {
  const { lines, ready: basketReady, clear: clearBasket } = useMaterialBasket();
  const captchaElement = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string; reference?: string; details?: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    ¶»§q«^