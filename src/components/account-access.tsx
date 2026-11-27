"use client";

import Link from "next/link";
import {CustomerAccountHub} from "./customer-account-hub";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import {safeCheckoutReturn} from "@/modules/orders/checkout-return";
import { createNeervaBrowserClient } from "@/modules/supabase/browser";

const supabase = createNeervaBrowserClient();

function friendlyAuthError(error: unknown) {
  const detail = typeof error === "object" && error !== null ? error as { code?: string; message?: string; status?: number } : {};
  const normalized = (detail.message ?? "").toLowerCase();
  if (detail.code === "over_email_send_rate_limit" || normalized.includes("over_email_send_rate_limit")) return "Our email service has reached its sending limit. Another attempt after 60 seconds may still fail. Check your inbox and spam for the latest link. If no link arrives, contact Neerva support or try later.";
  if (detail.code === "email_address_not_authorized") return "Verification email could not be delivered at this time. Contact Neerva support for help.";
  if (detail.status === 429 || /rate.limit|too many requests|only request this after/.test(normalized)) return "Too many requests. Please wait before retrying. Check your inbox and spam for an existing link.";
  if (/expired|otp_expired|invalid.*token/.test(normalized)) return "This email link or code is invalid or expired. Request a fresh one.";
  if (normalized.includes("privacy consent required")) return "Read the privacy notice and agree before creating an account.";
  if (normalized.includes("invalid login credentials")) return "Email or password is incorrect. Check both and try again.";
  if (normalized.includes("email not confirmed")) return "Verify your email using the link we sent, then sign in.";
  if (normalized.includes("user already registered")) return "An account already uses this email. Sign in instead.";
  if (normalized.includes("password should be at least")) return "Use a password with at least 8 characters.";
  return "We couldn’t complete sign-in. Please try again in a moment.";
}

export function AccountAccess({next}:{next?:string}={}) {
  const checkoutReturn=safeCheckoutReturn(next);const redirectPath=checkoutReturn?"/account/verify?"+new URLSearchParams({next:checkoutReturn}):"/account/verify";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [user, setUser] = useState<User | null>(null);
  const [roleData, setRoleData] = useState<{ userId: string; admin: boolean; dealer: boolean } | null>(null);
  const admin = Boolean(user && roleData?.userId === user.id && roleData.admin);
  const dealer = Boolean(user && roleData?.userId === user.id && roleData.dealer);
  const [magicEmail,setMagicEmail]=useState("");
  const [recovery,setRecovery]=useState(false);
  const [emailAction,setEmailAction]=useState<"link"|"resend"|"reset">("link");
  const [cooldownUntil,setCooldownUntil]=useState(0);
  const [secondsLeft,setSecondsLeft]=useState(0);
  const submissionLock=useRef(false);
  useEffect(()=>{if(!cooldownUntil)return;const timer=window.setInterval(()=>setSecondsLeft(Math.max(0,Math.ceil((cooldownUntil-Date.now())/1000))),1000);return()=>window.clearInterval(timer)},[cooldownUntil]);
  function startEmailCooldown(){setSecondsLeft(60);setCooldownUntil(Date.now()+60000)}
  const [phone,setPhone]=useState(""),[otp,setOtp]=useState(""),[phoneChallengeSent,setPhoneChallengeSent]=useState(false);
  const phoneOtpEnabled=process.env.NEXT_PUBLIC_PHONE_OTP_ENABLED==="true";
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => { if (active) setUser(data.session?.user ?? null); });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => { if (active) { setUser(session?.user ?? null); if(event==="PASSWORD_RECOVERY")setRecovery(true); if(event==="SIGNED_OUT")setRecovery(false); } });
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
    if (!supabase || submissionLock.current || (mode==="signup"&&Date.now()<cooldownUntil)) return;
    submissionLock.current=true;
    setBusy(true); setMessage(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage({ kind: "success", text: "You’re signed in. Your saved material list is still on this device." });
        if(checkoutReturn)window.location.assign(checkoutReturn);
      } else {
        if(form.get("privacyAccepted")!=="yes")throw new Error("Privacy consent required");
        const displayName = String(form.get("displayName") ?? "").trim();
        setMagicEmail(email);
        setEmailAction("resend");
        startEmailCooldown();
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo:window.location.origin+redirectPath, data: { display_name: displayName } } });
        if (error) throw error;
        setMessage({ kind: "success", text: data.session?.user.email_confirmed_at ? "Your verified account is ready." : "Check your email for verification. Private quotation requests require a verified email." });
      }
    } catch (error) {
      setMessage({ kind: "error", text: friendlyAuthError(error) });
    } finally { submissionLock.current=false;setBusy(false); }
  }


  async function sendMagicLink(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!supabase||submissionLock.current||busy||Date.now()<cooldownUntil)return;
    submissionLock.current=true;
    setBusy(true);setMessage(null);
    const email=magicEmail.trim().toLowerCase();
    const redirectTo=window.location.origin+redirectPath;
    startEmailCooldown();
    try{
      if(emailAction==="reset"){
        const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo});
        if(error)throw error;
      }else if(emailAction==="resend"){
        const {error}=await supabase.auth.resend({type:"signup",email,options:{emailRedirectTo:redirectTo}});
        if(error)throw error;
      }else{
        const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:redirectTo,shouldCreateUser:false}});
        if(error)throw error;
      }
      setMessage({kind:"success",text:"If this email is eligible, a link has been requested. Check your inbox and spam. Use the newest link."});
    }catch(error){setMessage({kind:"error",text:friendlyAuthError(error)})}
    finally{submissionLock.current=false;setBusy(false)}
  }
  async function updatePassword(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!supabase||!user||!recovery||submissionLock.current)return;
    const data=new FormData(event.currentTarget);
    const password=String(data.get("newPassword")??"");
    if(password.length<12||password!==data.get("confirmPassword")){
      setMessage({kind:"error",text:"Use at least 12 characters and enter the same password twice."});return;
    }
    submissionLock.current=true;setBusy(true);setMessage(null);
    try{
      const {error}=await supabase.auth.updateUser({password});
      if(error)throw error;
      const {error:signOutError}=await supabase.auth.signOut({scope:"global"});
      if(signOutError)throw signOutError;
      setRecovery(false);setUser(null);setMode("signin");setMessage({kind:"success",text:"Password changed. Sign in with your new password."});
    }catch(error){setMessage({kind:"error",text:friendlyAuthError(error)})}
    finally{submissionLock.current=false;setBusy(false)}
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
    }catch(error){setMessage({kind:"error",text:friendlyAuthError(error)})}
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
    }catch(error){setMessage({kind:"error",text:friendlyAuthError(error)})}
    finally{setBusy(false)}
  }
  return <div className="account-access-card">
    {!supabase ? <><span className="eyebrow">ACCOUNT SETUP</span><h2>Sign-in will open here.</h2><p>Customer and dealer accounts use NEERVA BUILD’s separate Supabase project. The account service is not configured yet, so no password field is shown and no credentials are collected.</p><div className="account-service-state"><span aria-hidden="true">○</span><span><strong>Waiting for backend setup</strong><small>Separate auth URL and public key are missing.</small></span></div></> : recovery && user ? <><h2>Set a new password.</h2><form className="account-auth-form" onSubmit={updatePassword}><label>New password<input name="newPassword" type="password" minLength={12} maxLength={128} required autoComplete="new-password"/></label><label>Confirm password<input name="confirmPassword" type="password" minLength={12} maxLength={128} required autoComplete="new-password"/></label><button className="button button-dark" disabled={busy}>Update password</button></form>{message&&<p role={message.kind==="error"?"alert":"status"} className={`account-feedback ${message.kind}`}>{message.text}</p>}</> : user ? <CustomerAccountHub key={user.id} user={user} admin={admin} dealer={dealer} checkoutReturn={checkoutReturn} onSignOut={async()=>{const {error}=await supabase.auth.signOut();if(error)throw error;}}/> : <>
      <div className="account-mode-switch"><button type="button" className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setMessage(null); }}>Sign in</button><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setMessage(null); }}>Create account</button></div>
      <h2>{mode === "signin" ? "Welcome back." : "Create your customer account."}</h2><p>{mode === "signin" ? "Manage your project and material requests." : "Review your material quotations and track orders from one account."}</p>
      <form className="account-auth-form" onSubmit={submit}>{mode === "signup" && <label>Your name<input name="displayName" required minLength={2} maxLength={100} autoComplete="name" /></label>}<label>Email address<input name="email" type="email" required maxLength={254} autoComplete="email" /></label><label>Password<input name="password" type="password" required minLength={8} maxLength={128} autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>{mode==="signup"&&<label className="neerva-account-consent"><input type="checkbox" name="privacyAccepted" value="yes" required/> <span>I agree to the <Link href="/privacy">privacy notice</Link> for creating an account.</span></label>}<button className="button button-dark" disabled={busy||(mode==="signup"&&secondsLeft>0)}>{busy ? "Please wait…" : mode === "signin" ? "Sign in securely →" : secondsLeft>0 ? `Request cooldown: ${secondsLeft}s` : "Create customer account →"}</button></form>
      {message && <div className={`account-feedback ${message.kind}`} role={message.kind === "error" ? "alert" : "status"}><p>{message.text}</p>{message.kind==="error"&&<Link href="/support">Contact Neerva support →</Link>}</div>}
      <form className="account-auth-form" onSubmit={sendMagicLink} style={{marginTop:23}}>
        <strong>Email verification and account recovery</strong><label>What do you need?<select value={emailAction} onChange={e=>{const value=e.target.value;if(value==="link"||value==="reset"||value==="resend")setEmailAction(value)}}><option value="link">Password-free sign-in</option><option value="resend">Resend verification email</option><option value="reset">Forgot password</option></select></label>
        <label>Your registered email<input type="email" value={magicEmail} onChange={e=>setMagicEmail(e.target.value)} required autoComplete="email" maxLength={254}/></label>
        <button className="button button-outline" disabled={busy||secondsLeft>0}>{secondsLeft>0?`Request cooldown: ${secondsLeft}s`:emailAction==="reset"?"Send password reset link →":emailAction==="resend"?"Resend verification email →":"Send secure email link →"}</button>
      </form>
      {phoneOtpEnabled?<form className="account-auth-form" onSubmit={phoneChallengeSent?verifyPhoneOtp:beginPhoneOtp} style={{marginTop:23}}>
        <strong>Phone OTP</strong>
        <label>Indian mobile number<input type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} required value={phone} onChange={e=>setPhone(e.target.value)}/></label>
        {phoneChallengeSent&&<label>SMS verification code<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={e=>setOtp(e.target.value)}/></label>}
        <button className="button button-outline" disabled={busy}>{phoneChallengeSent?"Verify SMS code →":"Request phone OTP →"}</button>
      </form>:<p style={{fontSize:13,color:"#5e7063",marginTop:18}}>Phone OTP sign-in is not enabled yet. An approved SMS provider must be configured first; no SMS is sent from this page.</p>}

      <small>Dealer staff and platform administrators need an approved role or tenant membership. Creating a customer account does not grant staff access.</small><Link href="/account/dealer">Learn about dealer registration →</Link>
    </>}
  </div>;
}
