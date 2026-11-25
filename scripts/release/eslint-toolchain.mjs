import {readFileSync} from "node:fs";
import {pathToFileURL} from "node:url";

export function lintIssues(manifest, lock) {
  const issues=[];
  const versions={next:manifest.dependencies?.next,eslint:manifest.devDependencies?.eslint,"eslint-config-next":manifest.devDependencies?.["eslint-config-next"]};
  const stable=/^\d+\.\d+\.\d+$/;
  if(lock.lockfileVersion!==3||!lock.packages?.[""])issues.push("Expected npm v3 package lock");
  const packages=lock.packages??{};
  if(stable.test(versions.eslint??"")&&!versions.eslint.startsWith("9."))issues.push("ESLint 9 is the reviewed major; major upgrades require explicit compatibility review");
  for(const [name,version] of Object.entries(versions)){
    const section=name==="next"?"dependencies":"devDependencies";
    if(!stable.test(version??""))issues.push(`${name} must be an exact stable version`);
    if(packages[""]?.[section]?.[name]!==version||packages[`node_modules/${name}`]?.version!==version)issues.push(`${name} manifest/lock mismatch`);
  }
  if(versions.next!==versions["eslint-config-next"])issues.push("Next.js and eslint-config-next must use the same release");
  for(const [path,pkg] of Object.entries(packages)){
    if(/\/node_modules\/eslint$/.test(path)&&pkg?.version!==versions.eslint)issues.push(`Mixed ESLint versions at ${path}`);
  }
  return issues;
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const issues=lintIssues(JSON.parse(readFileSync("package.json","utf8")),JSON.parse(readFileSync("package-lock.json","utf8")));
  if(issues.length){for(const issue of issues)console.error(issue);process.exitCode=1;}
  else console.log("ESLint and Next.js lockfile alignment verified.");
}
