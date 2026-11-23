"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createNeervaBrowserClient } from "@/modules/supabase/browser";

const supabase = createNeervaBrowserClient();

function friendlyAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("privacy consent required")) return "Read the privacy notice and agree before creating an account.";
  if (normalized.includes("invalid login credentials")) return "Email or password is incorrect. Check both and try again.";
  if (normalized.includes("email not confirmed")) return "Verify your email using the link we sent, then sign in.";
  if (normalized.includes("user already registered")) return "An account already uses this email. Sign in instead.";
  if (normalized.includes("password should be at least")) return "Use a password with at least 8 characters.";
  return "We couldn’t complete sign-in. Please try again in a moment.";
}

export function AccountAccess() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [user, setUser] = useState<User | null>(null);
  const [roleData, setRoleData] = useState<{ userId: string; admin: boolean; dealer: boolean } | null>(null);
  const admin = Boolean(user && roleData?.userId === user.id && roleData.admin);
  const dealer = Boolean(user && roleData?.userId === user.id && roleData.dealer);
  const [magicEmail,setMagicEmail]=useState("");
  const [phone,setPhone]=useState(""),[otp,setOtp]=useState(""),[phoneChallengeSent,setPhoneChallengeSent]=useState(false);
  const phoneOtpEnabled=process.env.NEXT_PUBLIC_PHONE_OTP_ENABLED==="true";
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => { if (active) setUser(data.session?.user ?? null); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (active) setUser(session?.user ?? null); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;
    let active = true;
    void Promise.all([
      supabase.rpc("has_platform_role", { p_roles: ["admin", "super_admin"] }),
      supabase.from("tenant_memberships").select("tenant_id").eq("user_id", user.id).eq("active", true).limit(1),
    ]).then(([adminResult, dealerResult]) => {
      if (active) setRoleData({ userId: user.id, admin: adminResult.data === true, dealer: Boolean(dealerResult.data?.length) });
    });
    return () => { active = false; };
  }, [user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage({ kind: "success", text: "You’re signed in. Your saved material list is still on this device." });
      } else {
        if(form.get("privacyAccepted")!=="yes")throw new Error("Privacy consent required");
        const displayName = String(form.get("displayName") ?? "").trim();
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } });
        if (error) throw error;
        setMessage({ kind: "success", text: data.session?.user.email_confirmed_at ? "Your verified account is ready." : "Check your email for verification. Private quotation requests require a verified email." });
      }
    } catch (error) {
      setMessage({ kind: "error", text: friendlyAuthError(error instanceof Error ? error.message : "") });
    } finally { setBusy(false); }
  }


  async function sendMagicLink(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!supabase||busy)return;
    setBusy(true);setMessage(null);
    try{
      const {error}=await supabase.auth.signInWithOtp({
        email:magicEmail.trim().toLowerCase(),
        options:{emailRedirectTo:window.location.origin+"/account",shouldCreateUser:false}
      });
      if(error)throw error;
      setMessage({kind:"success",text:"If an account exists, a sign-in link has been requested. Delivery depends on your email provider. Check spam if needed."});
    }catch(error){setMessage({kind:"error",text:friendlyAuthError(error instanceof Error?error.message:"")})}
    finally{setBusy(false)}
  }
  async function beginPhoneOtp(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!supabase||!phoneOtpEnabled||busy)return;
    if(!/^[6-9][0-9]{9}$/.test(phone)){setMessage({kind:"error",text:"Enter a valid 10-digit Indian mobile number."});return}
    setBusy(true);setMessage(null);
    try{const {error}=await supabase.auth.signInWithOtp({phone:"+91"+phone});
      if(error)throw error;
      setPhoneChallengeSent(true);
      setMessage({kind:"success",text:"OTP requested from the configured SMS provider. Enter the received code to continue."});
    }catch(error){setMessage({kind:"error",text:friendlyAuthError(error instanceof Error?error.message:"")})}
    finally{setBusy(false)}
  }
  async function verifyPhoneOtp(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!supabase||!phoneOtpEnabled||busy||!phoneChallengeSent)return;
    if(!/^[0-9]{6}$/.test(otp)){setMessage({kind:"error",text:"Enter the six-digit code you received."});return}
    setBusy(true);setMessage(null);
    try{const {error}=await supabase.auth.verifyOtp({phone:"+91"+phone,token:otp,type:"sms"});
      if(error)throw error;
      setMessage({kind:"success",text:"Phone verification succeeded. Your permissions still depend on approved roles."});
      setPhoneChallengeSent(false);setOtp("");
    }catch(error){setMessage({kind:"error",text:friendlyAuthError(error instanceof Error?error.message:"")})}
    finally{setBusy(false)}
  }
  return <div className="account-access-card">
    {!supabase ? <><span className="eyebrow">ACCOUNT SETUP</span><h2>Sign-in will open here.</h2><p>Customer and dealer accounts use NEERVA BUILD’s separate Supabase project. The account service is not configured yet, so no password field is shown and no credentials are collected.</p><div className="account-service-state"><span aria-hidden="true">○</span><span><strong>Waiting for backend setup</strong><small>Separate auth URL and public key are missing.</small></span></div></> : user ? <><span className="eyebrow">YOUR ACCOUNT</span><h2>You’re signed in.</h2><p>{user.email}</p><div className="account-dashboard-links">{admin && <Link href="/admin/catalog">Manage platform catalog →</Link>}{dealer && <Link href="/dealer/inventory">Open dealer inventory →</Link>}<Link href="/basket">Review your material list →</Link></div><button className="button button-outline" onClick={() => void supabase.auth.signOut()}>Sign out</button></> : <>
      <div className="account-mode-switch"><button type="button" className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setMessage(null); }}>Sign in</button><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(null); }}>Create account</button></div>
      <h2>{mode === "signin" ? "Welcome back." : "Create your customer account."}</h2><p>{mode === "signin" ? "Manage your project and material requests." : "Save projects, addresses and dealer quotations in one account."}</p>
      <form className="account-auth-form" onSubmit={submit}>{mode === "signup" && <label>Your name<input name="displayName" required minLength={2} maxLength={100} autoComplete="name" /></label>}<label>Email address<input name="email" type="email" required maxLength={254} autoComplete="email" /></label><label>Password<input name="password" type="password" required minLength={8} maxLength={128} autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>{mode==="signup"&&<label className="neerva-account-consent"><input type="checkbox" name="privacyAccepted" value="yes" required/> I agree to the <Link href="/privacy">privacy notice</Link> for creating an account.</label>}<button className="button button-dark" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in securely →" : "Create customer account →"}</button></form>
      <form className="account-auth-form" onSubmit={sendMagicLink} style={{marginTop:23}}>
        <strong>Prefer a password-free email sign-in?</strong>
        <label>Your registered email<input type="email" value={magicEmail} onChange={e=>setMagicEmail(e.target.value)} required autoComplete="email" maxLength={254}/></label>
        <button className="button button-outline" disabled={busy}>Send secure email link →</button>
      </form>
      {phoneOtpEnabled?<form className="account-auth-form" onSubmit={phoneChallengeSent?verifyPhoneOtp:beginPhoneOtp} style={{marginTop:23}}>
        <strong>Phone OTP</strong>
        <label>Indian mobile number<input type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} required value={phone} onChange={e=>setPhone(e.target.value)}/></label>
        {phoneChallengeSent&&<label>SMS verification code<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={e=>setOtp(e.target.value)}/></label>}
        <button className="button button-outline" disabled={busy}>{phoneChallengeSent?"Verify SMS code →":"Request phone OTP →"}</button>
      </form>:<p style={{fontSize:13,color:"#5e7063",marginTop:18}}>Phone OTP sign-in is not enabled yet. An approved SMS provider must be configured first; no SMS is sent from this page.</p>}
      {message && <p className={`account-feedback ${message.kind}`} role={message.kind === "error" ? "alert" : "status"}>{message.text}</p>}
      <small>Dealer staff and platform administrators need an approved role or tenant membership. Creating a customer account does not grant staff access.</small>
    </>}
  </div>;
}
