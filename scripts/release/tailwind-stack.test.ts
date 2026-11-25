import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("Tailwind core and PostCSS compiler use one exact release",()=>{
 const p=JSON.parse(readFileSync("package.json","utf8")),l=JSON.parse(readFileSync("package-lock.json","utf8"));
 const v=p.devDependencies.tailwindcss;assert.match(v,/^\d+\.\d+\.\d+$/);assert.equal(p.devDependencies["@tailwindcss/postcss"],v);
 for(const [path,m] of Object.entries(l.packages) as [string,{version?:string}][]){if(path==="node_modules/tailwindcss"||path==="node_modules/@tailwindcss/postcss"||path.endsWith("/node_modules/tailwindcss"))assert.equal(m.version,v,path);}
 assert.equal(l.packages["node_modules/@tailwindcss/postcss"].dependencies.tailwindcss,v);
});
