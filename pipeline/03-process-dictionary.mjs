// Cleans up the raw Webster's Revised Unabridged Dictionary (1913, public
// domain text via Project Gutenberg) JSON dump into the shape the app
// bundles. Source is a flat WORD -> definition-string map; keys are
// lowercased for lookup and the original text is kept for display.
//
// The dump has a well-known corruption: line-wrapped source text was
// joined without restoring the space, so e.g. "carbohydrates are" becomes
// "carbohydratesare". We repair it with a dictionary-based word
// segmenter (same idea as "wordninja"): any token that isn't a real word
// gets tried against a big English wordlist via DP, preferring the split
// into the fewest, longest real words.
import { readFileSync, writeFileSync } from "fs";

const raw = JSON.parse(
  readFileSync(new URL("./data/webster-raw.json", import.meta.url), "utf8")
);
const wordlist = readFileSync(
  new URL("./data/words_alpha.txt", import.meta.url),
  "utf8"
)
  .split("\n")
  .map((w) => w.trim())
  .filter(Boolean);

const VOCAB = new Set(wordlist);
for (const w of Object.keys(raw)) VOCAB.add(w.toLowerCase());

const common = readFileSync(
  new URL("./data/common10k.txt", import.meta.url),
  "utf8"
)
  .split("\n")
  .map((w) => w.trim().toLowerCase())
  .filter(Boolean);
const RANK = new Map(common.map((w, i) => [w, i]));
// Cost of using a piece: cheap for a common word (rank-based), expensive
// (but still possible) for an obscure dictionary word not in the common
// list — this favors the correct "carbohydrates"+"are" split over a
// coincidental "carbohydrate"+"sare" one, since "are" is rank ~20 and
// "sare" isn't a common word at all.
function pieceCost(piece) {
  // single-letter pieces ("a", "i") are only ever the real corruption in
  // rare cases, and otherwise tempt the DP into bad splits (e.g.
  // "a"+"resecretion" beating "are"+"secretion") — penalize them so they
  // only win when nothing better is available.
  const shortPenalty = piece.length === 1 ? 5 : 0;
  const rank = RANK.get(piece);
  if (rank !== undefined) return 1 + rank / 2000 + shortPenalty;
  return 6 + shortPenalty; // valid-but-obscure word: allowed, last resort
}

// Common short dictionary/grammar words that must be allowed as a split
// piece even though they're easy to false-positive on their own.
const MIN_PIECE = 2;

function segment(token) {
  const lower = token.toLowerCase();
  if (VOCAB.has(lower) || token.length < 4) return token;

  const n = lower.length;
  // best[i] = best (lowest total piece cost) segmentation of lower[0..i)
  const cost = new Array(n + 1).fill(Infinity);
  const back = new Array(n + 1).fill(-1);
  cost[0] = 0;
  for (let i = 1; i <= n; i++) {
    for (let j = Math.max(0, i - 20); j < i; j++) {
      const piece = lower.slice(j, i);
      if (piece.length < MIN_PIECE && j !== 0) continue;
      if (!VOCAB.has(piece)) continue;
      // +1.5 flat per extra piece so splitting into more, smaller common
      // words doesn't out-bid one correct obscure whole word (e.g.
      // "secretion" as a single word beating "secret" + "ion").
      const c = cost[j] + 1.5 + pieceCost(piece);
      if (c < cost[i]) {
        cost[i] = c;
        back[i] = j;
      }
    }
  }
  if (cost[n] === Infinity) return token; // couldn't segment, leave as-is

  const pieces = [];
  let i = n;
  while (i > 0) {
    const j = back[i];
    pieces.push(lower.slice(j, i));
    i = j;
  }
  pieces.reverse();
  if (pieces.length < 2) return token;
  // reject segmentations that produce too many tiny pieces (likely noise),
  // except the two single-letter words English actually has.
  if (pieces.some((p) => p.length < MIN_PIECE && p !== "a" && p !== "i"))
    return token;
  return pieces.join(" ");
}

function segmentWord(tok) {
  // peel off any leading/trailing punctuation so "oflight." still gets
  // its letters segmented, then glue it back on.
  const m = tok.match(/^(\W*)([a-zA-Z]+)(\W*)$/);
  if (!m) return tok;
  const [, lead, core, trail] = m;
  return lead + segment(core) + trail;
}

function fixSpacing(text) {
  return text
    .replace(/([.;:!?])([A-Z])/g, "$1 $2") // "sentence.Author" -> "sentence. Author"
    .split(/(\s+|-)/)
    .map(segmentWord)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

const entries = [];
let fixedCount = 0;
for (const [word, definition] of Object.entries(raw)) {
  if (!word || !definition) continue;
  const display = word
    .split(/(\s+|-)/)
    .map((part) =>
      /^[A-Z]+$/.test(part)
        ? part.charAt(0) + part.slice(1).toLowerCase()
        : part
    )
    .join("");
  const cleaned = fixSpacing(definition);
  if (cleaned !== definition.replace(/\s+/g, " ").trim()) fixedCount++;
  entries.push({
    word: display,
    key: word.toLowerCase(),
    definition: cleaned,
  });
}

entries.sort((a, b) => a.key.localeCompare(b.key));
console.log("dictionary entries:", entries.length);
console.log("entries with a spacing fix applied:", fixedCount);
writeFileSync(
  new URL("./data/dictionary.json", import.meta.url),
  JSON.stringify(entries)
);
