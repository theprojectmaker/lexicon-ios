// Fetch the Wikipedia "Vital articles / Level 3" title list (~1000 curated
// most-important topics) from English Wikipedia's own API. This is a
// community-curated "what every encyclopedia should cover" list, so it's a
// reasonable, defensible way to pick which topics to include rather than
// inventing our own list.
import { writeFileSync } from "fs";

const LEVELS = [
  "Wikipedia:Vital articles/Level 3",
  "Wikipedia:Vital articles/Level 4/Arts",
  "Wikipedia:Vital articles/Level 4/Biology and health sciences",
  "Wikipedia:Vital articles/Level 4/Everyday life",
  "Wikipedia:Vital articles/Level 4/Geography",
  "Wikipedia:Vital articles/Level 4/History",
  "Wikipedia:Vital articles/Level 4/Mathematics",
  "Wikipedia:Vital articles/Level 4/People",
  "Wikipedia:Vital articles/Level 4/Philosophy and religion",
  "Wikipedia:Vital articles/Level 4/Physical sciences",
  "Wikipedia:Vital articles/Level 4/Society and social sciences",
  "Wikipedia:Vital articles/Level 4/Technology",
];

async function fetchLinks(title) {
  const titles = new Set();
  let plcontinue;
  for (;;) {
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("prop", "links");
    url.searchParams.set("titles", title);
    url.searchParams.set("plnamespace", "0");
    url.searchParams.set("pllimit", "500");
    url.searchParams.set("format", "json");
    if (plcontinue) url.searchParams.set("plcontinue", plcontinue);
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "LexiconOfflineSchoolApp/1.0 (solomonsasson031@gmail.com; one-time offline data build)",
      },
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.log("rate limited, waiting 5s...");
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }
    const page = Object.values(data.query.pages)[0];
    for (const l of page.links || []) {
      if (l.title !== "0") titles.add(l.title);
    }
    if (!data.continue) break;
    plcontinue = data.continue.plcontinue;
  }
  return titles;
}

const all = new Set();
for (const level of LEVELS) {
  const t = await fetchLinks(level);
  console.log(level, "->", t.size, "titles");
  for (const title of t) all.add(title);
  await new Promise((r) => setTimeout(r, 1000));
}

const list = [...all].sort();
console.log("total unique topics:", list.length);
writeFileSync(
  new URL("./data/topics.json", import.meta.url),
  JSON.stringify(list, null, 1)
);
