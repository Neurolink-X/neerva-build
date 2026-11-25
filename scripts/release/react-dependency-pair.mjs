import {readFileSync} from "node:fs";
import {pathToFileURL} from "node:url";

export function reactIssues(manifest,lock){
 const issues=[];
 const runtime=["react","react-dom"],types=["@types/react","@types/react-dom"];
 const stable=/^\d+\.\d+\.\d+$/;
 const minor=v=>String(v).split(".").slice(0,2).join(".");
 const packages=lock.packages??{};
 if(lock.lockfileVersion!==3||!packages[""])issues.push("Expected npm v3 package lock");
 const versions={};
 for(const name of [...runtime,...types]){
  const section=runtime.includes(name)?"dependencies":"devDependencies";
  const version=manifest[section]?.[name];versions[name]=version;
  if(!stable.test(version??""))issues.push(`${name} must be an exact stable release`);
  if(packages[""]?.[section]?.[name]!==version||packages[`node_modules/${name}`]?.version!==version)issues.push(`${name} manifest/lock mismatch`);
  for(const [path,entry] of Object.entries(packages)){
   if(path.endsWith(`/node_modules/${name}`)&&entry?.version!==version)issues.push(`Duplicate incompatible ${name} at ${path}`);
  }
 }
 if(versions.react!==versions["react-dom"])issues.push("React and React DOM must use the same runtime release");
 if(minor(versions["@types/react"])!==minor(versions["@types/react-dom"]))issues.push("React declaration packages must share major/minor");
 if(minor(versions.react)!==minor(versions["@types/react"]))issues.push("React runtime and declarations must share major/minor");
 return issues;
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const issues=reactIssues(JSON.parse(readFileSync("package.json","utf8")),JSON.parse(readFileSync("package-lock.json","utf8")));
  if(issues.length){for(const issue of issues)console.error(issue);process.exitCode=1;}
  else console.log("React runtime and declarations match the lockfile.");
}
