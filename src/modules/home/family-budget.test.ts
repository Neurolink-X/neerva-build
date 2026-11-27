import test from "node:test";
import assert from "node:assert/strict";
import {familyBudget} from "./family-budget.ts";
const input={builtArea:800,rate:1500,extras:100000,reservePercent:10,budget:1400000};
test("estimate uses actual entered area, cost and reserve and exposes shortfall",()=>{
 assert.deepEqual(familyBudget(input),{construction:1200000,extras:100000,reserve:130000,total:1430000,balance:-30000});
 assert.equal(familyBudget({...input,budget:0})?.balance,null);
 assert.equal(familyBudget({...input,budget:1500000})?.balance,70000);
});
test("invalid, missing, nonfinite or excessive numbers fail closed",()=>{
 for(const v of [{builtArea:0},{rate:NaN},{rate:-1},{extras:-1},{reservePercent:51},{budget:Infinity},{builtArea:150000,rate:100000}])assert.equal(familyBudget({...input,...v}),null);
});
