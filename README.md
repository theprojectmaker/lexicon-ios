# Lexicon

A fully offline reference app for school: a dictionary plus a general-knowledge
encyclopedia, both bundled into the app at build time. No accounts, no server, no
network calls — ever, including on first launch.

## What's inside

- **Dictionary** — ~86,000 entries from *Webster's Revised Unabridged Dictionary
  (1913)*, via Project Gutenberg (public domain). The raw text dump has a known
  "missing space" OCR artifact (`carbohydratesare formed`); `pipeline/03-process-dictionary.mjs`
  repairs most of it with a dictionary-based word segmenter.
- **Encyclopedia** — a few thousand topic summaries pulled from *Simple English
  Wikipedia* (CC BY-SA 4.0). The topic list comes from Wikipedia's own
  community-curated "vital articles" lists (Level 3 + Level 4), kept only where a
  matching Simple Wikipedia article exists. This is a curated subset, not the full
  encyclopedia — the in-app "About" screen says so.

Both datasets are plain JSON (`pipeline/data/dictionary.json`,
`pipeline/data/encyclopedia.json`), bundled straight into the JS bundle. Search is a
binary-search prefix lookup over each sorted-by-key array (`src/search.ts`) — no
SQLite, no extra search library, fast enough on-device for ~90k combined entries.

## Rebuilding the data

```bash
npm run build-data
```

Runs the full pipeline: fetch the vital-articles topic list from English Wikipedia,
pull matching Simple Wikipedia extracts, then clean up both into
`pipeline/data/dictionary.json` / `encyclopedia.json`. Needs internet; the app itself
never needs it.

## Running the app

```bash
npm install
npm start
```

## Shipping

See [SHIP.md](./SHIP.md).
