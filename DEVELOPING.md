# DQM3 development

Run `python3 -m http.server 8000` from the repository root. No build step or external API is needed. `dqm4/` is independent.

Scripts deliberately retain the existing classic-script global scope and inline handlers. Load synchronously in this order: `common.js` (shared state, DOM references and navigation), `monsters.js` (cards/search/sort/filter), `skills.js`, `recommend.js`, `storage.js` (existing persistence and panel state), `plan.js`, then `app.js` (event binding, tabs and initialization). Do not add `async` or load `app.js` before the other scripts. This is an incremental extraction, not a module-system rewrite.

Persisted keys must remain compatible: `dqm3-plan-v2`, `dqm3-saved-plans-v1`, `dqm3-acquired-monsters-v1`, `dqm3-plan-panel-expanded-v1`, `dqm3-recommend-panel-expanded-v1`. Plan checks and route choices are keyed by target and tree path. Never clear origin-wide localStorage. Data collection scripts overwrite JSON; they are not part of ordinary frontend checks.

When changing frontend assets, update the version in `index.html`, `app.js` and `sw.js` together and list every script in the service worker CORE cache. Preserve the separate DQM4 scope and cache. Check all JS with `node --check` and verify browser behavior and offline startup.
