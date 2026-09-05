# Release

This is a Vite SPA with the Vercel function `/api/rulebook-data`. A static-only host does not provide the same application.

## Before deployment

- Use Node 22.13 or later. Install the locked dependencies with `npm ci`.
- Run `npm test`, `npm run lint`, and `npm run build`. The build excludes plaintext `public/rules` and checks static assets for private packs, source excerpts, connection keys and local paths.
- Confirm `public/private-updates/latest.json` and its content-addressed ciphertext exist. These encrypted assets are included with the function. Source preparation is separate from code deployment; do not rotate the established key or overwrite private source files to fix a build.
- Set `MORKBORG_DATA_KEY` in the intended Vercel environment using its secret settings. It must match the existing publisher key. Never use a `VITE_` prefix, put the key in a command argument, commit it, or print it.
- Vercel uses `npm run build`, output `dist`, and the function's explicit `includeFiles`. SPA rewrites exclude API, static assets and private working paths ([Vercel Vite routing](https://vercel.com/docs/frameworks/frontend/vite), [rewrite configuration](https://vercel.com/docs/project-configuration/vercel-json)). An unknown API path must remain a 404.

## Production-mode local smoke

Run `npm run build`, then provide `MORKBORG_DATA_KEY` through a server process environment and run `npm run preview`. Preview now invokes the same server handler as the Vercel function; it does not fall back to plaintext files or the development publisher file. It binds to loopback by default. Do not expose this preview as a public server.

Verify a fresh browser: Desk loads; source status becomes ready; Reaction, Action + Theme and a regional monster work; Source, Copy, Pins and Recent work; existing Campaign/Dungeon/Character and import/export still work. Refresh a direct SPA path. Verify `/api/missing` and `/rules/library.json` return 404. Restart preview without the key and use a fresh browser context: the endpoint returns a generic no-store 503 and the UI offers retry/import. A browser with a valid cache should remain usable and show the server failure.

## Delivery and recovery

Browser → same-origin no-store endpoint → authenticated encrypted asset → complete pack parsing and combined Oracle validation → one IndexedDB compare-and-swap transaction → active stores. A complete valid cache can activate before an online check; partial/corrupt caches cannot activate as a complete production registry. Missing data requests the full bundle. Revision metadata avoids repeated transfers; lower server revisions are rejected. Failed validation, download or storage does not advance the accepted revision or replace active data.

Updates retain edited private text/stats/selectors and add missing source records, fields and explicit aliases. They are additive, not a replacement for a deliberately edited local source pack. To replace conflicting manual source edits, import a verified complete private bundle explicitly. Campaign storage is separate and never changes during source updates.

The function returns source data to the running application; encryption separates stored static assets and server credentials, not access control for visitors. Keep the existing application's access policy. No new authentication or publication is performed by these checks.

Deployment remains a separate authorized action. After deployment, repeat the smoke against the intended Vercel environment and confirm the function has its matching key and encrypted asset revision.
