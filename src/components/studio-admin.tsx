"use client";
import { useState } from "react";
import { createNeervaBrowserClient } from "@/modules/supabase/browser";
import { conceptRules, type Rules } from "@/modules/studio/layout";
export function StudioAdmin() {
  const [city, setCity] = useState("Kanpur"),
    [values, setValues] = useState<Rules>(conceptRules),
    [msg, setMsg] = useState("");
  async function load() {
    const db = createNeervaBrowserClient();
    if (!db) {
      setMsg("Account service unavailable.");
      return;
    }
    const { data, error } = await db
      .from("studio_rules")
      .select("front,rear,side,bags,steel")
      .eq("city", city.trim())
      .maybeSingle();
    if (error) {
      setMsg("Could not load rules.");
      return;
    }
    setValues((data as Rules) ?? conceptRules);
    setMsg(
      data
        ? "Saved city settings loaded."
        : "Concept defaults loaded. Verify the site rules before publishing.",
    );
  }
  return (
    <>
      <h1>Studio configuration</h1>
      <form
        className="rfq-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const db = createNeervaBrowserClient();
          if (!db) {
            setMsg("Account service unavailable.");
            return;
          }
          const { error } = await db
            .from("studio_rules")
            .upsert({ city: city.trim(), ...values });
          setMsg(
            error
              ? "Could not publish. Sign in with an administrator account."
  ¶»§q«^