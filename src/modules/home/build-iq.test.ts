import test from "node:test";
import assert from "node:assert/strict";
import {dailyQuestions,questions,quizScore} from "./build-iq.ts";
test("daily round is deterministic, valid and unique",()=>{for(let day=-20;day<50;day++){const q=dailyQuestions(day);assert.equal(q.length,3);assert.equal(new Set(q.map(x=>x.id)).size,3);assert.deepEqual(q,dailyQuestions(day));assert.equal(quizScore(q,q.map(x=>x.correct)),3)}});
test("all educational questions have valid unique answers and local next steps",()=>{assert.equal(new Set(questions.map(x=>x.id)).size,questions.length);for(const q of questions){assert.ok(q.correct>=0&&q.correct<q.options.length);assert.ok(q.why.length>0&&q.href.startsWith("/"));assert.equal(new Set(q.options).size,q.options.length)}assert.equal(quizScore(questions,[]),0)});
