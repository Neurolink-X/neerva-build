"use client";

import Script from "next/script";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMaterialBasket } from "@/components/material-basket";

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
    if (!scriptReady || !siteKey || !captchaElement.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(captchaElement.current, {
      sitekey: siteKey,
      callback: setToken,
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [scriptReady]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (includeBasket && (!basketReady || lines.length === 0)) {
      setStatus({ kind: "error", message: "Your material list is empty. Add at least one product before preparing this quote." });
      return;
    }
    if (!token) {
      setStatus({ kind: "error", message: "Complete the security check before submitting." });
      return;
    }
    setBusy(true);
    setStatus(null);
    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget);
    const requestedDate = String(form.get("requestedDate") ?? "");
    idempotencyKey.current ??= crypto.randomUUID();
    const firstLine = includeBasket ? lines[0] : null;
    const payload = {
      idempotencyKey: idempotencyKey.current,
      categorySlug: firstLine?.category ?? String(form.get("categorySlug")),
      materialDescription: firstLine ? `${firstLine.productName} · ${firstLine.option}` : String(form.get("materialDescription")),
      quantity: firstLine?.quantity ?? Number(form.get("quantity")),
      unit: firstLine?.unit ?? String(form.get("unit")),
      ...(includeBasket ? { lineItems: lines.map(({ category, productSlug, productName, brand, option, quantity, unit }) => ({ categorySlug: category, productSlug, productName, brand, option, quantity, unit })) } : {}),
      city: String(form.get("city")),
      pincode: String(form.get("pincode")),
      ...(requestedDate ? { requestedDate } : {}),
      contactName: String(form.get("contactName")),
      phone: String(form.get("phone")),
      turnstileToken: token,
    };
    try {
      const response = await fetch("/api/rfqs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => null) as { requestId?: string; error?: string; reference?: string; fields?: { field: string; message: string }[] } | null;
      if (!response.ok) {
        setStatus({ kind: "error", message: result?.error ?? "We couldn’t send this request. Your details are still here—please retry shortly.", reference: result?.reference, details: result?.fields?.map((field) => field.message) });
        return;
      }
      setStatus({ kind: "success", message: "Your quote request was received. Keep this reference if you contact support.", reference: result?.requestId });
      if (includeBasket) clearBasket();
      formElement.reset();
      idempotencyKey.current = null;
    } catch {
      setStatus({ kind: "error", message: "We couldn’t reach the quote service. Your details are still here—check your connection and retry." });
    } finally {
      setBusy(false);
      setToken("");
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
    }
  }

  return (
    <form className="rfq-form" onSubmit={submit}>
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={() => setScriptReady(true)} />}
      <div className="rfq-form-title"><span>{includeBasket ? "MULTI-ITEM QUOTE REQUEST" : "QUOTE REQUEST"}</span><small>Prices are shared privately by eligible dealers.</small></div>
      {includeBasket && <div className="quote-lines-preview"><strong>{basketReady ? `${lines.length} material lines attached` : "Loading saved material list…"}</strong>{lines.map((line) => <span key={line.key}>{line.quantity} {line.unit.replaceAll("_", " ")} · {line.productName} · {line.option}</span>)}<a href="/basket">Review or edit material list →</a></div>}
      <div className="rfq-form-grid">
        {!includeBasket && <>
        <label>Material category<select name="categorySlug" defaultValue={defaultCategory}><option value="aggregates">Balu, morang or aggregates</option><option value="steel">Steel / TMT</option><option value="cement">Cement</option><option value="bricks-blocks">Bricks / blocks</option><option value="plumbing">Pipes / plumbing</option><option value="electrical">Electrical / hardware</option></select></label>
        <label>Material details<input name="materialDescription" required minLength={3} maxLength={240} defaultValue={defaultMaterial} placeholder="Type, grade, size or other details" /></label>
        <label>Quantity<input name="quantity" required type="number" min="0.001" step="0.001" max="1000000" placeholder="e.g. 1" /></label>
        <label>Unit<select name="unit" defaultValue="truck"><option value="truck">Truck</option><option value="tonne">Tonne</option><option value="cubic_metre">Cubic metre</option><option value="bag">Bag</option><option value="piece">Piece</option><option value="bundle">Bundle</option><option value="kg">Kilogram</option><option value="quintal">Quintal</option></select></label>
        </>}
        <label>City<input name="city" required minLength={2} maxLength={80} defaultValue={defaultCity} placeholder="Your delivery city" /></label>
        <label>Pincode<input name="pincode" required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} placeholder="6-digit pincode" /></label>
        <label>Preferred delivery date (optional)<input name="requestedDate" type="date" min={new Date().toLocaleDateString("en-CA")} /></label>
        <label>Your name<input name="contactName" required minLength={2} maxLength={100} autoComplete="name" placeholder="Name" /></label>
        <label>Mobile number<input name="phone" required type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} autoComplete="tel-national" placeholder="10-digit mobile number" /></label>
      </div>
      {siteKey ? <div ref={captchaElement} className="turnstile-wrap" /> : <p className="rfq-unavailable">Secure enquiries are not configured yet. No request will be sent or stored.</p>}
      {status && <div className={`rfq-status ${status.kind}`} role={status.kind === "error" ? "alert" : "status"}><p>{status.message}</p>{status.details && status.details.length > 0 && <ul>{status.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}{status.reference && <small>Reference: {status.reference}{status.kind === "error" ? ". Share it with support if this continues." : ""}</small>}</div>}
      <button className="button button-dark rfq-submit" type="submit" disabled={!siteKey || busy}>{busy ? "Sending securely…" : status?.kind === "error" ? "Try again →" : "Request dealer quotes →"}</button>
      <small className="rfq-privacy">Your contact details are used only to respond to this request. Do not enter payment details here.</small>
    </form>
  );
}
