/** Static catalog images must be bundled, never fetched from vendor CDNs. */
export function isLocalCatalogMedia(value:unknown):value is string{
 return typeof value==="string"&&/^\/images\/catalog\/[a-z0-9_/-]+\.(?:webp|avif|png|jpe?g|svg)$/i.test(value)&&!value.includes("..")&&!value.includes("//");
}
