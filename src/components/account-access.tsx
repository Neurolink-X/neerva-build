"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createNeervaBrowserClient } from "@/modules/supabase/browser";

const supabase = createNeervaBrowserClient();

function friendlyAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "Email or password is incorrect. Check both and try again.";
  if (normalized.includes("email not confirmed")) return "Verify your email using the link we sent, then sign in.";
  if (normalized.includes("user already registered")) return "An account already uses this email. Sign in instead.";
  if (normalized.includes("password should be at least")) return "Use a password with at least 8 characters.";
  return "We couldnâ€™t complete sign-in. Please try again in a moment.";
}

export function AccountAccess() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [user, setUser] = useState<User | null>(null);
  const [roleData, setRoleData] = useState<{ userId: string; admin: boolean; dealer: boolean; roles: string[] } | null>(null);
  const admin = Boolean(user && roleData?.userId === user.id && roleData.admin);
  const dealer = Boolean(user && roleData?.userId === user.id && roleData.dealer);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null)¶»§q«^