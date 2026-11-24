import {canonicalPublicOrigin} from "@/modules/seo/site-origin";
import type {MetadataRoute} from "next";
import {publicIndexingEnabled} from "@/modules/seo/indexing";
export default function robots():MetadataRoute.Robots{
 const siteUrl=canonicalPublicOrigin(process.env);
 if(!publicIndexingEnabled(process.env))return {rules:[{userAgent:"*",disallow:"/"}]};
 return {rules:[{userAgent:"*",allow:"/",disallow:["/account","/admin","/dealer","/api","/basket","/quotes"]}],sitemap:`${siteUrl}/sitemap.xml`};
}
