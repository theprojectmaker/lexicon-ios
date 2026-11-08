# Shipping Lexicon to TestFlight

Lexicon is a standalone Expo SDK 57 app. iOS builds run **free** on a GitHub Actions
macOS runner (`eas build --local` + `eas submit`), mirroring the other apps
(see the `github-actions-ios-builds` memory). A brand-new app needs **one
interactive setup** by you before GitHub can build it.

## Already done (by Claude, 2026-11-07)
- Full app: offline search over a 1913 public-domain dictionary (~86k words) and a
  curated Simple Wikipedia encyclopedia subset (CC BY-SA), both bundled into the app —
  no download step, no network calls, ever.
- `app.json` (bundle `com.solyapps.lexicon`, iOS + Android identifiers).
- `eas.json`, `.github/workflows/ios-testflight.yml`, `scripts/check-sdk.cjs`.
- Verified: web preview renders, search returns correct results for common school
  topics (dictionary + encyclopedia both tested live), lock in sync.
- **EAS project created**: `@solomonsasson/lexicon`, projectId `b8dc87fd-e401-4880-800c-16d8c68a8f34`
  (in `app.json`).

## What's left — needs YOUR logins (I can't do these)
These two require your Apple ID (with 2FA) and your Expo token, which I can't enter.

### Fastest path — one interactive command does it all
```
npx eas-cli@latest build --platform ios --profile production --auto-submit
```
Log in to Apple when prompted (2FA). This creates the signing credentials, builds
Lexicon in the EAS cloud, and submits it to TestFlight — creating the App Store
Connect app. After it finishes, copy the new `ascAppId` it reports into `eas.json`
(`submit.production.ios.ascAppId`, currently `REPLACE_WITH_ASC_APP_ID`), then commit
and push.

### To use the FREE GitHub builds afterward
```
powershell -ExecutionPolicy Bypass -File scripts/setup-github.ps1
```
Creates the public GitHub repo `theprojectmaker/lexicon-ios`, pushes this folder, and
asks for your Expo token (make one at
https://expo.dev/accounts/solomonsasson/settings/access-tokens) to save as the
`EXPO_TOKEN` secret.

## Every build after that
```
"C:/Program Files/GitHub CLI/gh.exe" workflow run ios-testflight.yml -R theprojectmaker/lexicon-ios -f submit=true
```
Push the tree before running — the runner builds the pushed commit, not local edits.

## Notes
- No model, no download, no account — this is the simplest of the recent apps to
  ship: once credentials exist, every later build is just data + code, no API keys.
- If you ever want to refresh the encyclopedia/dictionary data, run `npm run build-data`
  (needs internet) and commit the updated `pipeline/data/*.json` files.
