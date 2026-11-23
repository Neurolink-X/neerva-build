import type {MetadataRoute} from "next";
import {publicIndexingEnabled} from "@/modules/seo/indexing";
export default function robots():MetadataRoute.Robots{
 const siteUrl=process.env.NEXT_PUBLIC_SITE_URL??"http://localhost:3000";
 if(!publicIndexingEnabled(process.env))return {rules:[{userAgent:"*",disallow:"/"}]};
 return {rules:[{userAgent:"*",allow:"/",disallow:["/account","/admin","/dealer","/api","/basket","/quotes"]}],sitemap:`${siteUrl}/sitemap.xml`};
}
