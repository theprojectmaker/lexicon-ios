// Turns the raw Simple Wikipedia extracts into the shape the app bundles:
// trims trailing section headers Wikipedia sometimes leaves at the end of
// a truncated extract (e.g. "\n\n\n== History ==\n" with nothing after
// it), and drops anything still too short to be useful.
import { readFileSync, writeFileSync } from "fs";

const raw = JSON.parse(
  readFileSync(
    new URL("./data/encyclopedia-raw.json", import.meta.url),
    "utf8"
  )
);

function clean(text) {
  return text
    .replace(/==+\s*[^=\n]*\s*==+/g, "") // "== Origin ==" style section headings, anywhere
    .replace(/\(\s*(?:LINK-[\p{L}\p{M}-]+[;,]?\s*)+\)?/gu, "(") // unrendered pronunciation-template placeholders
    .replace(/\(\s*;\s*/g, "(") // leftover "( ; " after stripping the above
    .replace(/\s+/g, " ")
    .replace(/\(\s*\)/g, "")
    .trim();
}

const entries = raw
  .map((e) => ({
    title: e.title,
    key: e.title.toLowerCase(),
    summary: clean(e.extract),
  }))
  .filter((e) => e.summary.length >= 60);

entries.sort((a, b) => a.key.localeCompare(b.key));
console.log("encyclopedia entries:", entries.length);
writeFileSync(
  new URL("./data/encyclopedia.json", import.meta.url),
  JSON.stringify(entries)
);
