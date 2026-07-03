# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal, single-user pescatarian weekly meal planner and grocery list generator. Plain HTML/CSS/JS — no build step, no bundler, no framework, no backend. Everything is deterministic and drawn from a curated, hardcoded food pool in `data.js`; nothing is AI-generated text. The point is decision removal, not recipe discovery: tap a button, get a plan.

## Commands

There is no build step, package manager, linter, or test suite — don't invent one.

- **Run locally**: open `index.html` directly, or `python -m http.server 8000` and visit `http://localhost:8000`.
- **Syntax-check after editing**: `node --check data.js` / `node --check app.js`.
- **Verify behavior**: there's no test suite, so changes are verified by driving a real headless browser. This repo has no Playwright/Puppeteer installed — the established pattern is Node's built-in `WebSocket` talking raw Chrome DevTools Protocol to a locally-launched headless Edge/Chrome (`--headless=new --remote-debugging-port=<port>`), navigating to the served page, evaluating JS in-page to drive interactions and read `localStorage`, and capturing screenshots. Always set the CDP viewport via `Emulation.setDeviceMetricsOverride` — `--window-size` is not respected by headless Edge in this mode and silently produces a wrong-width page.
- **Deploy**: push to `master` triggers `.github/workflows/pages.yml`, which copies `index.html`/`style.css`/`data.js`/`app.js` (not `README.md`, `prompt.md`, or `.claude/`) into a Pages artifact and deploys via `actions/deploy-pages`. That final deploy step intermittently fails with a generic "Deployment failed, try again later" from GitHub's side (build always succeeds) — `gh run rerun <run-id> --repo saitekii/grocery-generator` resolves it, usually within 1-2 retries.

## Architecture

**`data.js`** is pure data: food pools by category (`PROTEINS`/`CARBS`/`VEGETABLES`/`FRUITS`/`FATS`/`PANTRY`), meal templates (`MEALS_NO_COOK`/`MEALS_MICROWAVE`/`MEALS_QUICK_COOK`), the nutrient watchlist, and `FIXED_BREAKFAST`. `app.js` is all logic, rendering, and state — it never hardcodes food/meal data itself.

**Meal composition rule**: every meal except ones tagged `snack: true` must include at least one item each from protein, carbs, fats, and (vegetables or fruit) — enforced by convention when curating `data.js`, not by runtime code. Violations have shipped twice before (missing a food group, or a combination — like a whole baked potato and mug-scrambled eggs bundled as one "meal" — that doesn't correspond to how anyone would actually cook it). When adding or editing meals, sanity-check both the macro composition and whether it's a plausible single dish for its declared cook method/time.

**Ingredient display vs. grocery list**: `background: true` items (currently just olive oil) and anything in the `pantry` category (garlic, ginger, lemon, lime) are omitted from a meal's headline ingredient line (`mealIngredients()`) because they read as clutter, not a dish description — but they still appear on the grocery list and in the `seasoning` array shown as "Season with: ...". Dried spices/condiments (salt, cumin, soy sauce, etc.) exist only in `seasoning` text, never as buyable items, since most people already keep those stocked.

**State** (`app.js`, `localStorage` key `groceryGenerator:v4`): `{ activeWeekStart, weeks: { [mondayISODate]: { days, groceryIds, checked } } }`. Weeks are keyed by their Monday date and kept indefinitely (a year of weekly plans is well under a megabyte) — there is no expiry or pruning. Each day holds `MEALS_PER_DAY` slots (`{ mealId, prefs: {style, highProtein, cheap} }`); per-meal prefs, not global toggles, drive filtering. Bump the `STORAGE_KEY` version suffix on any breaking change to this shape rather than writing migration code — this is a single-user local app, so old saved state is simply abandoned, not migrated. This has happened several times already (v1→v4).

**Meal regeneration**: `pickBestForGap()` picks a replacement for one slot by scoring candidates on how many currently-missing nutrients (across every *other* scheduled meal + `FIXED_BREAKFAST`) they'd newly cover, preferring a meal not already used elsewhere in the week, and falling back to allowing a duplicate only if the slot's preference-filtered pool is too small to avoid one. The bulk "Generate Week" action (`generateWeek()`) instead draws all 14 slots at once from the full unconstrained pool via `pickMeals()` + `improveCoverage()`.

**Nutrient watchlist** (`NUTRIENT_WATCHLIST` in `data.js`) is deliberately not a full RDA table — it excludes nutrients that are essentially unavoidable on any whole-food diet (phosphorus, B5, B7, chromium, molybdenum) and sodium (whose real-world risk runs the opposite direction). Only add a nutrient here if you're also adding real, distinct ingredient sources for it — don't let coverage become trivially 100% from a single ingredient.

**UI structure**: three tabs (Plan / Grocery List / Saved Weeks) toggled via `.tab-panel.hidden`, no router. `renderAll()` re-renders all three panels on any state change; there's no partial/incremental rendering.

**PWA**: `manifest.json` + `sw.js` make the app installable (standalone display, home-screen icon) and work offline via a precache in `sw.js`. Bump `CACHE_VERSION` in `sw.js` whenever `index.html`/`style.css`/`data.js`/`app.js` change — same versioning convention as `STORAGE_KEY`, and without it returning users keep getting served the stale cached version instead of your changes. Icons in `icons/` were generated by rendering an SVG in a headless browser and screenshotting it via CDP at each target size (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png` at 180px, `favicon-32.png`) — regenerate the same way if the icon design ever changes, rather than hand-editing PNGs.
