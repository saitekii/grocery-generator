# Quick Pescatarian Grocery Generator

**Live app:** https://saitekii.github.io/grocery-generator/

A personal, lightweight web app that generates a weekly grocery list and simple meal ideas for a pescatarian, low-cost, low-effort, low-added-sugar diet. Not recipe discovery — decision removal: tap one button, get a shopping list and a week of meals.

## How it works

Everything is deterministic and drawn from a curated, hardcoded food pool — no AI-generated text. One button ("Generate Week") plans one meal per day for 7 days from `no-cook` / `microwave` / `quick-cook` pools, builds a grocery list grouped by category from their ingredients, and shows how well that week covers a watchlist of ~25 micronutrients pescatarians commonly under-eat (omega-3, B12, iron, zinc, iodine, etc).

- **Toggles**: Ultra lazy mode (no-cook only), High protein mode, Extra cheap mode
- **Slider**: Cooking effort (0–100), gates which meal types are eligible
- **Per-day regenerate**: each day has its own "Regenerate this day" button, which swaps in a replacement chosen to cover whatever nutrients are still missing across the rest of the week, while avoiding duplicating a meal already used on another day
- **Fixed daily breakfast**: a recurring meal (oats, peanut butter, banana, kefir) that's always folded into the grocery list and counted toward nutrient coverage, so the generator doesn't waste picks duplicating it
- **Tap for detail**: grocery items and nutrient chips are tappable — items show which tracked nutrients they contain, nutrient chips show which foods provide them and whether those foods are already in this week's list
- **State**: the whole week (days, grocery list, checked items, toggles) auto-persists to `localStorage` on every change — no backend, no accounts

## Stack

Plain HTML/CSS/JS. No build step, no dependencies, no bundler. Mobile-first.

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
