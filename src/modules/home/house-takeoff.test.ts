
import test from "node:test";
import assert from "node:assert/strict";
import {houseTakeoff} from "./house-takeoff.ts";
import {siteKnowledge,searchKnowledge} from "./site-knowledge.ts";
import {lessons} from "./academy.ts";
const x={floorArea:100,wallLength:10,wallHeight:10,wallThickness:200,openings:0,concreteVolume:2,cementPerM3:350,sandPerM3:700,aggregatePerM3:1100,barLengths:[{diameter:12,length:1000},{diameter:8,length:0}],paintCoverage:10,paintCoats:2,waste:5};
test("measured house quantity sheet uses distinct units and allowance",()=>{const r=houseTakeoff(x)!;assert.equal(r.bricks,976);assert.equal(r.cementBags,15);assert.ok(Math.abs(r.steelKg-932.2)<1);assert.equal(r.tilesSqFt,105);assert.ok(r.paintLitres>3.8);assert.equal(houseTakeoff({...x,openings:101}),null);assert.equal(houseTakeoff({...x,barLengths:[{diameter:12,length:-1}]}),null)});
test("knowledge search supports Hindi and English; every answer links to a lesson",()=>{assert.ok(searchKnowledge("सरिया").length>=2);assert.ok(searchKnowledge("cement").length>=2);assert.equal(searchKnowledge("zzzz-not-found").length,0);assert.equal(new Set(siteKnowledge.map(q=>q.question)).size,siteKnowledge.length);assert.ok(siteKnowledge.every(q=>lessons.some(l=>l.id===q.lesson)&&q.hindi.length>20))});
