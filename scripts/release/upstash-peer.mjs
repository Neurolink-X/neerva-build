import {readFileSync} from "node:fs";
import {pathToFileURL} from "node:url";
const parse=v=>typeof v==="string"&&/^\d+\.\d+\.\d+$/.test(v)?v.split(".").map(Number):null;
export function upstashIssues(p,l){
 const issues=[],packages=l.packages??{},root=packages[""]?.dependencies??{},name="@upstash/redis",rate="@upstash/ratelimit",redis=p.dependencies?.[name],limiter=p.dependencies?.[rate];
 for(const n of [name,rate]){const v=p.dependencies?.[n];if(!parse(v)||root[n]!==v||packages["node_modules/"+n]?.version!==v)issues.push("Manifest/lock mismatch: "+n);}
 const peer=packages["node_modules/"+rate]?.peerDependencies?.[name],a=parse(redis),min=typeof peer==="string"&&peer.startsWith("^")?parse(peer.slice(1)):null;
 if(!a||!min||min[0]===0||a[0]!==min[0]||a[1]<min[1]||a[1]===min[1]&&a[2]<min[2])issues.push("Upstash Redis peer incompatible or unreviewed: "+peer);
 return issues;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const issues=upstashIssues(JSON.parse(readFileSync("package.json","utf8")),JSON.parse(readFileSync("package-lock.json","utf8")));
 if(issues.length){console.error(issues.join("\n"));process.exitCode=1;}else console.log("Upstash peer compatibility passed");
}
