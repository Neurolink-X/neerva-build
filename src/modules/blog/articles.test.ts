import assert from "node:assert/strict";
import { test } from "node:test";
import { articles, getArticle } from "./articles.ts";

test("published blog articles have stable, unique public slugs and bilingual content", () => {
  const slugs = articles.map((article) => article.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.ok(articles.length > 0);
  for (const article of articles) {
    assert.match(article.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(article.title.length > 12);
    assert.ok(article.titleHi.length > 12);
    assert.equal(article.sections.length, article.sectionsHi.length);
    assert.ok(article.sources.length >= 2);
    assert.ok(article.sections.every((section) => section.blocks.length > 0));
  }
});

test("first buying guide covers final delivered costs and official references", () => {
  const article = getArticle("how-to-compare-construction-material-quotes");
  assert.ok(article);
  const text = article.sections.flatMap((section) => [section.heading, ...section.blocks.flatMap((block) => block.type === "list" ? block.items : block.type === "callout" ? [block.title, block.text] : [block.text])]).join(" ").toLowerCase();
  assert.match(text, /freight/);
  assert.match(text, /unloading/);
  assert.match(text, /validity/);
  assert.ok(article.sources.some((source) => source.href.includes("bis.gov.in")));
  assert.ok(article.sources.some((source) => source.href.includes("gst.gov.in")));
});
