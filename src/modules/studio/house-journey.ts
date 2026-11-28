/** One matched, locally bundled AI illustration pair. Never activate just one image. */
export const houseJourney={
 finished:{src:"/images/studio/journey-finished.webp",bytes:70978,sha256:"ab2c914646f40ffcabe72a8f87fe8f83119ab57041cf684c11e17a23a36c26eb"},
 shell:{src:"/images/studio/journey-shell.webp",bytes:90288,sha256:"e58b5f908e13fed6a364d1a7561aee1094ef30f08443833c23fe3f760bcbfe86"},
 width:1200,height:400
} as const;

/** Stable on-disk paths are a compatibility contract for local consumers.
 * Browser requests carry the actual content digest to avoid stale cached paint masks.
 * Unrelated photos, including uploaded files, are left unchanged. */
export function houseJourneyImageUrl(src:string):string{
 const asset=[houseJourney.finished,houseJourney.shell].find(a=>a.src===src);
 return asset?asset.src+"?v="+asset.sha256.slice(0,16):src;
}

/** Only the reviewed pair's exact digest URLs can enter Next image optimization.
 * Derive the allowlist from the same manifest as the browser URL. */
export const houseJourneyLocalPatterns=[houseJourney.finished,houseJourney.shell].map(a=>({pathname:a.src,search:"?v="+a.sha256.slice(0,16)}));
