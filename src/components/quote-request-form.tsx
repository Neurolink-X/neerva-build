"use client";

import Script from "next/script";
import { useEffect, useRef, useState, type FormEvent } from "react";

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

export function QuoteRequestForm({ defaultCity }: { defaultCity: string }) {
  const captchaElement = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
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
    if (!token) {
      setStatus({ kind: "error", message: "Complete the security check before submitting." });
      return;
    }
    setBusy(true);
    setStatus(null);
    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget);
    const payload = {
      idempotencyKey: crypto.randomUUID(),
      categorySlug: String(form.get("categorySlug")),
      materialDescription: String(form.get("materialDescription")),
      quantity: Number(form.get("quantity")),
      unit: String(form.get("unit")),
      city: String(form.get("city")),
      pincode: String(form.get("pincode")),
      contactName: String(form.get("contactName")),
      phone: String(form.get("phone")),
      turnstileToken: token,
    };
    try {
      const response = await fetch("/api/rfqs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { requestId?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Could not submit your request.");
      setStatus({ kind: "success", message: `Request received. Reference: ${result.requestId}` });
      formElement.reset();
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Could not submit your request." });
    } finally {
      setBusy(false);
      setToken("");
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
    }
  }

  return (
    <form className="rfq-form" onSubmit={submit}>
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={() => setScriptReady(true)} />}
      <div className="rfq-form-title"><span>QUOTE REQUEST</span><small>Prices are shared privately by eligible dealers.</small></div>
      <div className="rfq-form-grid">
        <label>Material category<select name="categorySlug" defaultValue="aggregates"><option value="aggregates">Balu, morang or aggregates</option><option value="steel">Steel / TMT</option><option value="cement">Cement</option><option value="bricks-blocks">Bricks / blocks</option><option value="plumbing">Pipes / plumbing</option><option value="electrical">Electrical / hardware</option></select></label>
        <label>Material details<input name="materialDescription" required minLength={3} maxLength={240} placeholder="Type, grade, size or other details" /></label>
        <label>Quantity<input name="quantity" required type="number" min="0.001" step="0.001" max="1000000" placeholder="e.g. 1" /></label>
        <label>Unit<select name="unit" defaultValue="truck"><option value="truck">Truck</option><option value="tonne">Tonne</option><option value="cubic_metre">Cubic metre</option><option value="bag">Bag</option><option value="piece">Piece</option><option value="bundle">Bundle</option><option value="kg">Kilogram</option><option value="quintal">Quintal</option></select></label>
        <label>City<input name="city" required minLength={2} maxLength={80} defaultValue={defaultCity} placeholder="Your delivery city" /></label>
        <label>Pincode<input name="pincode" required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} placeholder="6-digit pincode" /></label>
        <label>Your name<input name="contactName" required minLength={2} maxLength={100} autoComplete="name" placeholder="Name" /></label>
        <label>Mobile number<input name="phone" required type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} autoComplete="tel-national" placeholder="10-digit mobile number" /></label>
      </div>
      {siteKey ? <div ref={captchaElement} className="turnstile-wrap" /> : <p className="rfq-unavailable">Secure enquiries are not configured yet. No request will be sent or stored.</p>}
      {status && <p className={`rfq-status ${status.kind}`} role={status.kind === "error" ? "alert" : "status"}>{status.message}</p>}
      <button className="button button-dark rfq-submit" type="submit" disabled={!siteKey || busy}>{busy ? "Sending securely…" : "Request dealer quotes →"}</button>
      <small className="rfq-privacy">Your contact details are used only to respond to this request. Do not enter payment details here.</small>
    </form>
  );
}
