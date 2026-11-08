export type DictionaryEntry = { word: string; key: string; definition: string };
export type EncyclopediaEntry = { title: string; key: string; summary: string };

// Bundled at build time — no network call, ever. Both arrays are sorted by
// `key` already (see pipeline/03 and pipeline/04), which is what lets
// search.ts binary-search them instead of scanning linearly.
//
// IMPORTANT: these two JSON files are ~22MB combined (86k + 9k entries).
// `require()`-ing them eagerly at module-eval time blocks the JS thread
// before the first frame ever draws, which on a real device can trip iOS's
// launch watchdog (an instant crash at open) or spike startup memory. So
// loading is deferred to `loadData()`, called once from App.tsx *after* a
// splash frame has already rendered — never import `dictionary` /
// `encyclopedia` directly; call `loadData()` then `getDictionary()` /
// `getEncyclopedia()`.
let dictionary: DictionaryEntry[] | null = null;
let encyclopedia: EncyclopediaEntry[] | null = null;
let loadPromise: Promise<void> | null = null;

export function loadData(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve) => {
    // One more tick past the splash frame so React has definitely painted
    // before this (synchronous, unavoidable) parse work runs.
    setTimeout(() => {
      dictionary = require('../../pipeline/data/dictionary.json');
      encyclopedia = require('../../pipeline/data/encyclopedia.json');
      resolve();
    }, 0);
  });
  return loadPromise;
}

export function getDictionary(): DictionaryEntry[] {
  if (!dictionary) throw new Error('getDictionary() called before loadData() resolved');
  return dictionary;
}

export function getEncyclopedia(): EncyclopediaEntry[] {
  if (!encyclopedia) throw new Error('getEncyclopedia() called before loadData() resolved');
  return encyclopedia;
}
