"use client";
import { useState } from "react";
import { createNeervaBrowserClient } from "@/modules/supabase/browser";
export function OrderInvoice({ id, buying }: { id: string; buying: boolean }) {
  const [msg, setMsg] = useState(""),
    [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false);
  const bucket = createNeervaBrowserClient()?.storage.from("neerva-invoices");
  async function open() {
    if (!bucket) return;
    setBusy(true);
    try {
      const { data, error } = await bucket.createSignedUrl(
        id + "/invoice.pdf",
        120,
        { download: "invoice.pdf" },
      );
      if (error || !data) {
        setUrl("");
        setMsg("A dealer invoice is not available yet.");
        return;
      }
      setUrl(data.signedUrl);
      setMsg("Download link valid for two minutes.");
    } catch {
      setMsg("Invoice service unavailable.");
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file || !bucket) return;
    if (file.type !== "application/pdf" || file.size > 5 * 1024 * 1024) {
      setMsg("Choose a PDF under 5 MB.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await bucket.upload(id + "/invoice.pdf", file, {
        upsert: false,
        contentType: "application/pdf",
      });
      setMsg(
        error
          ? "Upload failed. Check access or an existing invoice."
          : "Invoice attached to this order.",
      );
    } catch {
      setMsg¶»§q«^