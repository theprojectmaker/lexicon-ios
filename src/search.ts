import { getDictionary, getEncyclopedia, DictionaryEntry, EncyclopediaEntry } from './data';

// Both source arrays are pre-sorted by `key`, so a prefix search is a
// binary search for the lower bound followed by a linear scan forward
// while the prefix still matches — O(log n + k) instead of O(n), with no
// extra index to build or load. Fast enough on-device for 80k+ entries
// with zero native dependencies.
function lowerBound<T extends { key: string }>(arr: T[], prefix: string): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid].key < prefix) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function searchDictionary(query: string, limit = 40): DictionaryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const dictionary = getDictionary();
  const start = lowerBound(dictionary, q);
  const out: DictionaryEntry[] = [];
  for (let i = start; i < dictionary.length && out.length < limit; i++) {
    if (!dictionary[i].key.startsWith(q)) break;
    out.push(dictionary[i]);
  }
  return out;
}

export function searchEncyclopedia(query: string, limit = 25): EncyclopediaEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const encyclopedia = getEncyclopedia();
  const start = lowerBound(encyclopedia, q);
  const prefixMatches: EncyclopediaEntry[] = [];
  for (let i = start; i < encyclopedia.length && prefixMatches.length < limit; i++) {
    if (!encyclopedia[i].key.startsWith(q)) break;
    prefixMatches.push(encyclopedia[i]);
  }
  if (prefixMatches.length >= limit) return prefixMatches;

  // Fall back to "contains" so e.g. "lincoln" still finds
  // "Abraham Lincoln" even though it doesn't start with it.
  const seen = new Set(prefixMatches.map((e) => e.key));
  const containsMatches: EncyclopediaEntry[] = [];
  for (const entry of encyclopedia) {
    if (containsMatches.length + prefixMatches.length >= limit) break;
    if (seen.has(entry.key)) continue;
    if (entry.key.includes(q)) containsMatches.push(entry);
  }
  return [...prefixMatches, ...containsMatches];
}

export function exactDictionaryMatch(query: string): DictionaryEntry | undefined {
  const q = query.trim().toLowerCase();
  const dictionary = getDictionary();
  const start = lowerBound(dictionary, q);
  const entry = dictionary[start];
  return entry && entry.key === q ? entry : undefined;
}
