// For each vital-article topic, pull a plain-text extract from SIMPLE
// English Wikipedia (not full English Wikipedia) — shorter sentences,
// smaller payload, and a license (CC BY-SA) we credit in the app.
// The "extracts" API prop only reliably returns text for ONE title per
// request when batched, so this fetches one at a time with light
// concurrency and a polite delay/User-Agent.
import { readFileSync, writeFileSync, existsSync } from "fs";

const topics = JSON.parse(
  readFileSync(new URL("./data/topics.json", import.meta.url), "utf8")
);

// Checkpoint as we go (one long run previously got killed near the end
// with nothing saved) — resume by skipping titles already done.
const CHECKPOINT_URL = new URL("./data/encyclopedia-raw.json", import.meta.url);
const done = new Map();
if (existsSync(CHECKPOINT_URL)) {
  for (const r of JSON.parse(readFileSync(CHECKPOINT_URL, "utf8"))) {
    done.set(r.title, r);
  }
  console.log(`resuming: ${done.size} topics already fetched`);
}
const remaining = topics.filter((t) => !done.has(t));

const UA =
  "LexiconOfflineSchoolApp/1.0 (solomonsasson031@gmail.com; one-time offline data build)";

async function fetchExtract(title) {
  const url = new URL("https://simple.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("prop", "extracts");
  url.searchParams.set("explaintext", "1");
  url.searchParams.set("exchars", "1200");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("titles", title);
  url.searchParams.set("format", "json");
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    await new Promise((r) => setTimeout(r, 3000));
    return fetchExtract(title);
  }
  const page = Object.values(data.query.pages)[0];
  if (!page || page.missing !== undefined || !page.extract) return null;
  const extract = page.extract.trim();
  if (extract.length < 40) return null; // disambiguation/stub, not useful
  return { title: page.title, extract };
}

const CONCURRENCY = 6;
const newResults = [];
let cursor = 0;
let doneCount = 0;

function checkpoint() {
  const all = [...done.values(), ...newResults];
  all.sort((a, b) => a.title.localeCompare(b.title));
  writeFileSync(CHECKPOINT_URL, JSON.stringify(all, null, 1));
  return all.length;
}

async function worker() {
  while (cursor < remaining.length) {
    const i = cursor++;
    const title = remaining[i];
    try {
      const r = await fetchExtract(title);
      if (r) newResults.push(r);
    } catch (e) {
      console.error("failed:", title, e.message);
    }
    doneCount++;
    if (doneCount % 100 === 0) {
      console.log(`${doneCount}/${remaining.length} (checkpointing...)`);
      checkpoint();
    }
    await new Promise((r) => setTimeout(r, 30));
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const total = checkpoint();
console.log(`done: ${total} usable extracts saved to encyclopedia-raw.json`);
