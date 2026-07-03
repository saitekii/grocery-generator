# Quick Pescatarian Grocery Generator

**Live app:** https://saitekii.github.io/grocery-generator/

A personal, lightweight web app that generates a weekly grocery list and simple meal ideas for a pescatarian, low-cost, low-effort, low-added-sugar diet. Not recipe discovery — decision removal: tap one button, get a shopping list and a week of meals.

## How it works

Everything is deterministic and drawn from a curated, hardcoded food pool — no AI-generated text. Three tabs:

- **Plan** — "Generate Week" fills Lunch + Dinner for all 7 days (Monday–Sunday, real calendar dates) from `no-cook` / `microwave` / `quick-cook` pools, builds a grocery list from their ingredients, and shows how well the week covers a watchlist of ~25 micronutrients pescatarians commonly under-eat (omega-3, B12, iron, zinc, iodine, etc). Prev/next arrows step to any other week, past or future.
- **Grocery List** — the shopping list for whichever week is active, grouped by category with checkboxes.
- **Saved Weeks** — every week you've ever generated, kept indefinitely (a year of weekly plans is well under a megabyte of `localStorage`). Tap one to reopen it in Plan, fully editable.

Each meal card has its own controls — a No-cook / Microwave / Cook switch plus High-protein and Cheap chips — and its own "Regenerate" button, which swaps in a replacement matching those preferences, chosen to cover whatever nutrients are still missing across the rest of that week, and avoiding a meal already used elsewhere in the week where possible. There's no whole-week toggle panel; preferences are set per meal.

- **Fixed daily breakfast**: a recurring meal (oats, peanut butter, banana, kefir) that's always folded into the grocery list and counted toward nutrient coverage, so the generator doesn't waste picks duplicating it
- **Tap for detail**: grocery items and nutrient chips are tappable — items show which tracked nutrients they contain, nutrient chips show which foods provide them and whether those foods are already in this week's list
- **Already have**: tap the 🏠 on any grocery item to mark it as a staple you keep stocked (olive oil, peanut butter, ...) — it drops off every future week's list until you tap "Add back," e.g. once you actually run out. This is global, not per-week, unlike the shopping checkboxes.
- **State**: every week (its meals, per-meal preferences, grocery list, checked items) auto-persists to `localStorage` on every change, keyed by its Monday date — no backend, no accounts

## Stack

Plain HTML/CSS/JS. No build step, no dependencies, no bundler. Mobile-first, installable (manifest + service worker) — "Add to Home Screen" opens it standalone, and it keeps working offline after the first load.

## Running locally

Open `index.html` directly in a browser, or serve the folder with any static file server, e.g.:

```
python -m http.server 8000
```

then visit `http://localhost:8000`.

## Files

- `index.html` — page structure
- `style.css` — mobile-first styling
- `data.js` — the food pool, meal templates, and nutrient tagging
- `app.js` — generation logic, rendering, localStorage persistence
- `manifest.json` / `sw.js` / `icons/` — installability (Add to Home Screen) and offline caching
