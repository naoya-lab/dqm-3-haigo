# DQM3 development

Run `python3 -m http.server 8000` from the repository root. No build step or external API is needed. `dqm4/` is independent.

Scripts deliberately retain the existing classic-script global scope and inline handlers. Load synchronously in this order: `common.js` (shared state, DOM references and navigation), `monsters.js` (cards/search/sort/filter), `skills.js`, `recommend.js`, `storage.js` (existing persistence and panel state), `plan.js`, then `app.js` (event binding, tabs and initialization). Do not add `async` or load `app.js` before the other scripts. This is an incremental extraction, not a module-system rewrite.

Persisted keys must remain compatible: `dqm3-plan-v2`, `dqm3-saved-plans-v1`, `dqm3-acquired-monsters-v1`, `dqm3-plan-panel-expanded-v1`, `dqm3-recommend-panel-expanded-v1`. Plan checks and route choices are keyed by target and tree path. Never clear origin-wide localStorage. Data collection scripts overwrite JSON; they are not part of ordinary frontend checks.

When changing frontend assets, update the version in `index.html`, `app.js` and `sw.js` together and list every script in the service worker CORE cache. Preserve the separate DQM4 scope and cache. Check all JS with `node --check` and verify browser behavior and offline startup.


Backup format v1 is `{format: "dqm3-haigo-backup", version: 1, createdAt, storage}`. `storage` holds the five explicitly registered keys as their original strings (or null for absent keys). `parseBackup` validates the entire envelope and supported payloads before confirmation; `restoreBackupEntries` only replaces those keys and rolls back write failures. Add a migration before accepting a new version; do not silently accept unknown fields. When adding persisted user settings, update the registry, validators, and round-trip tests together. Transient search/sort/filter selections are not persisted, matching previous behavior. Browser cache and DQM4 storage are excluded.

Acquired status is a name-based marker, not an inventory count. It must not remove any plan materials. Manual plan checks still register the monster as acquired, matching previous behavior; acquired markers alone never check plan nodes. Disabling the minimum rank retains auto checks as manual checks, also matching previous behavior. Tree DOM wrappers provide guides; target/path keys, route choice and material calculations are unchanged.

Validation commands:

- `node tests/storage.test.cjs`: four storage cases, including invalid payloads and rollback on quota failure; no external dependency.
- Start the local server above, then `node tests/browser.cjs`: requires Playwright and system Chromium (`CHROMIUM_PATH` can override `/usr/bin/chromium`), uses an isolated browser profile and a 390px touch viewport. Covers old data, filtering/search/sort, plan checks and scrolling, saved routes/materials, actual file export/import and offline startup. `DQM_TEST_ORIGIN` overrides the test URL.
- `node tests/upgrade.cjs`: starts its own temporary HTTP server and verifies the original v50 update button, new service worker, storage preservation and offline plan. Requires Git history at `f1cf4a7`, or set `DQM_LEGACY_REF` to a compatible v50 commit. No production server or user profile is modified.

Automated Chromium mobile emulation is not a real iPhone Safari / home-screen PWA test. Before release, check download-to-Files and import, touch checkboxes, deep-tree scrolling, offline relaunch and update on an actual iPhone. The GitHub Pages root, manifest identity/start URL, storage keys and `dqm4/` remain unchanged.
