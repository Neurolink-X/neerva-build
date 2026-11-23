"use client";
import Link from "next/link";
export function StudioAdmin(){return <section style={{padding:20,background:"#fffdf8",border:"1px solid #d7e0d5",borderRadius:16}}><h2>Studio administration</h2><p>Original designs are stored as reviewed JSON and are not yet editable through an authenticated database. Do not publish unapproved structures or cost estimates.</p><p><Link href="/design-studio/library">Review 24 concept designs →</Link></p><p>Admin editing, architect sign-off and pricing publication require dedicated role-scoped storage and approval workflow.</p></section>}
