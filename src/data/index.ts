export type DictionaryEntry = { word: string; key: string; definition: string };
export type EncyclopediaEntry = { title: string; key: string; summary: string };

// Bundled at build time — no network call, ever. Both arrays are sorted
// by `key` already (see pipeline/03 and pipeline/04), which is what lets
// search.ts binary-search them instead of scanning linearly.
export const dictionary: DictionaryEntry[] = require('../../pipeline/data/dictionary.json');
export const encyclopedia: EncyclopediaEntry[] = require('../../pipeline/data/encyclopedia.json');
