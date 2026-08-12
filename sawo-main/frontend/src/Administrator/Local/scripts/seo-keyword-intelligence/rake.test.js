// rake.test.js — run with `node --test rake.test.js` (Node's built-in test
// runner, no test-framework dependency added).
import { test } from "node:test";
import assert from "node:assert/strict";
import { extractKeywords } from "./rake.js";

test("extracts multi-word candidate phrases, dropping stopwords", () => {
  const results = extractKeywords({
    title: "Wall-Mounted Sauna Heaters",
    headings: [],
    metaDescription: "",
    body: "Shop our wall-mounted sauna heaters, the best sauna heaters for small spaces.",
  });

  const phrases = results.map((r) => r.phrase);
  assert.ok(phrases.includes("wall mounted sauna heaters") || phrases.includes("mounted sauna heaters"));
  assert.ok(!phrases.some((p) => p.includes(" the ") || p === "the"));
});

test("weights title phrases higher than body phrases", () => {
  const results = extractKeywords({
    title: "Sauna Heaters",
    headings: [],
    metaDescription: "",
    body: "Sauna heaters are great. Also check our clocks and thermometers and pails and ladles.",
  });

  const byPhrase = Object.fromEntries(results.map((r) => [r.phrase, r.score]));
  assert.ok(byPhrase["sauna heaters"] > (byPhrase["clocks"] || 0));
});

test("aggregates a phrase repeated across title and body", () => {
  const withRepeat = extractKeywords({
    title: "Sauna Heaters",
    headings: [],
    metaDescription: "",
    body: "Our sauna heaters are the best sauna heaters around.",
  });
  const withoutRepeat = extractKeywords({
    title: "Sauna Heaters",
    headings: [],
    metaDescription: "",
    body: "Nothing else relevant here.",
  });

  const repeatedScore = withRepeat.find((r) => r.phrase === "sauna heaters").score;
  const singleScore = withoutRepeat.find((r) => r.phrase === "sauna heaters").score;
  assert.ok(repeatedScore > singleScore);
});

test("returns an empty array for empty input", () => {
  const results = extractKeywords({ title: "", headings: [], metaDescription: "", body: "" });
  assert.deepEqual(results, []);
});

test("drops very short/numeric tokens and long phrases", () => {
  const results = extractKeywords({
    title: "",
    headings: [],
    metaDescription: "",
    body: "2024 model no 12 is a a a a a a a very long run-on phrase example here today",
  });
  for (const r of results) {
    assert.ok(!/^\d+$/.test(r.phrase));
    assert.ok(r.phrase.split(" ").length <= 5);
  }
});
