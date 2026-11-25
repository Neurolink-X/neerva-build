import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const p=JSON.parse(readFileSync("package.json","utf8"));
const lock=JSON.parse(readFileSync("package-lock.json","utf8"));
const d=p.dependencies,dev=p.devDependencies;
assert.equal(d.react,d["react-dom"],"React and React DOM must use the same exact runtime release");
const minor=v=>String(v).split(".").slice(0,2).join(".");
assert.equal(minor(dev["@types/react"]),minor(dev["@types/react-dom"]),"React types must share the same major/minor release");
for(const [name,version] of Object.entries({react:d.react,"react-dom":d["react-dom"],"@types/react":dev["@types/react"],"@types/react-dom":dev["@types/react-dom"]})){
 assert.equal(lock.packages["node_modules/"+name]?.version,version,name+" lockfile mismatch");
}
console.log("React runtime and declaration pairs match package and lockfile.");
