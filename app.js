(function () {
  const STORAGE_KEY = "groceryGenerator:v3";
  const DAY_COUNT = 7;
  const MEALS_PER_DAY = 2;
  const SLOT_LABELS = ["Lunch", "Dinner"];

  const els = {
    generateBtn: document.getElementById("generateBtn"),
    ultraLazy: document.getElementById("ultraLazy"),
    highProtein: document.getElementById("highProtein"),
    extraCheap: document.getElementById("extraCheap"),
    effort: document.getElementById("effort"),
    effortValue: document.getElementById("effortValue"),
    emptyState: document.getElementById("emptyState"),
    groceryListSection: document.getElementById("groceryListSection"),
    groceryList: document.getElementById("groceryList"),
    mealsSection: document.getElementById("mealsSection"),
    saveStatus: document.getElementById("saveStatus"),
    fixedBreakfastNote: document.getElementById("fixedBreakfastNote"),
    daysList: document.getElementById("daysList"),
    nutrientSection: document.getElementById("nutrientSection"),
    nutrientSummary: document.getElementById("nutrientSummary"),
    nutrientChips: document.getElementById("nutrientChips"),
    nutrientSourceDetail: document.getElementById("nutrientSourceDetail"),
  };

  // { toggles: {...}, days: [{date: "yyyy-mm-dd", mealIds: [id, id]}], groceryIds: string[], checked: {id: bool} }
  let state = null;
  let saveFlashTimer = null;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Monday of the calendar week containing today (ISO-style week start).
  function getMondayOfCurrentWeek() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday ... 6 = Saturday
    const diffToMonday = day === 0 ? -6 : 1 - day;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
  }

  function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatDateDisplay(isoDateStr) {
    const [y, m, d] = isoDateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }

  function getAllowedTypes(effort, ultraLazy) {
    if (ultraLazy) return ["no-cook"];
    if (effort <= 33) return ["no-cook"];
    if (effort <= 66) return ["no-cook", "microwave"];
    return ["no-cook", "microwave", "quick-cook"];
  }

  function isCheapMeal(meal) {
    return meal.items.every((id) => ITEMS[id].cheap);
  }

  function filterMeals(toggles) {
    const allowedTypes = getAllowedTypes(toggles.effort, toggles.ultraLazy);
    let pool = ALL_MEALS.filter((m) => allowedTypes.includes(m.type));

    if (toggles.highProtein) {
      const narrowed = pool.filter((m) => m.highProtein);
      if (narrowed.length > 0) pool = narrowed;
    }

    if (toggles.extraCheap) {
      const narrowed = pool.filter(isCheapMeal);
      if (narrowed.length > 0) pool = narrowed;
    }

    return pool;
  }

  function pickMeals(pool, count) {
    if (pool.length === 0) return [];
    const result = [];
    let shuffled = shuffle(pool);
    while (result.length < count) {
      if (shuffled.length === 0) shuffled = shuffle(pool);
      result.push(shuffled.pop());
    }
    return result;
  }

  function mealNutrients(meal) {
    const set = new Set();
    meal.items.forEach((id) => (ITEMS[id].nutrients || []).forEach((n) => set.add(n)));
    return set;
  }

  function fixedBreakfastNutrients() {
    return mealNutrients(FIXED_BREAKFAST);
  }

  function computeCoverage(meals) {
    const covered = fixedBreakfastNutrients();
    meals.forEach((meal) => mealNutrients(meal).forEach((n) => covered.add(n)));
    return covered;
  }

  // Greedily swaps in eligible meals that cover currently-missing
  // watchlist nutrients, so a week isn't just random - it also nudges
  // toward broader micronutrient coverage where the filtered pool allows it.
  // Nutrients already supplied by the fixed daily breakfast don't need a swap.
  function improveCoverage(meals, pool) {
    const result = meals.slice();
    NUTRIENT_WATCHLIST.forEach((nutrient) => {
      if (computeCoverage(result).has(nutrient)) return;
      const candidate = shuffle(pool).find(
        (m) => !result.includes(m) && mealNutrients(m).has(nutrient)
      );
      if (!candidate) return;
      const swapIndex = Math.floor(Math.random() * result.length);
      result[swapIndex] = candidate;
    });
    return result;
  }

  // Picks the single best replacement for one meal slot: whichever eligible
  // candidate newly covers the most nutrients still missing across every
  // *other* scheduled meal + fixed breakfast, and isn't already used
  // elsewhere in the week if that can be avoided. Falls back to a random
  // pick once nothing is missing, and allows a duplicate only if the
  // filtered pool is too small to avoid one.
  function pickBestForGap(pool, otherMeals, excludeMealId) {
    const otherMealIds = new Set(otherMeals.map((m) => m.id));
    let candidates = pool.filter(
      (m) => m.id !== excludeMealId && !otherMealIds.has(m.id)
    );
    if (candidates.length === 0) {
      candidates = pool.filter((m) => m.id !== excludeMealId);
    }
    if (candidates.length === 0) return null;

    const coveredWithoutSlot = computeCoverage(otherMeals);
    const missing = NUTRIENT_WATCHLIST.filter((n) => !coveredWithoutSlot.has(n));

    const shuffled = shuffle(candidates);
    if (missing.length === 0) return shuffled[0];

    let best = shuffled[0];
    let bestScore = -1;
    shuffled.forEach((m) => {
      const score = Array.from(mealNutrients(m)).filter((n) => missing.includes(n)).length;
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
    });
    return best;
  }

  function mealsFromDays(days) {
    const meals = [];
    days.forEach((d) => {
      d.mealIds.forEach((id) => {
        const meal = ALL_MEALS.find((m) => m.id === id);
        if (meal) meals.push(meal);
      });
    });
    return meals;
  }

  function buildGroceryIds(meals) {
    const seen = new Set(FIXED_BREAKFAST.items);
    meals.forEach((meal) => meal.items.forEach((id) => seen.add(id)));
    return Array.from(seen);
  }

  // Cooking mediums (olive oil) and pantry aromatics (garlic, lemon, ...)
  // are on the grocery list and in the seasoning note, but aren't things
  // you'd name when describing the dish - so they're left out of the
  // headline ingredient line.
  function mealIngredients(meal) {
    return meal.items
      .filter((id) => ITEMS[id].category !== "pantry" && !ITEMS[id].background)
      .map((id) => ITEMS[id].name)
      .join(" + ");
  }

  function readToggles() {
    return {
      ultraLazy: els.ultraLazy.checked,
      highProtein: els.highProtein.checked,
      extraCheap: els.extraCheap.checked,
      effort: Number(els.effort.value),
    };
  }

  function applyTogglesToControls(toggles) {
    els.ultraLazy.checked = toggles.ultraLazy;
    els.highProtein.checked = toggles.highProtein;
    els.extraCheap.checked = toggles.extraCheap;
    els.effort.value = toggles.effort;
    els.effortValue.textContent = toggles.effort;
    els.effort.disabled = toggles.ultraLazy;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function flashSaved() {
    els.saveStatus.classList.remove("hidden");
    clearTimeout(saveFlashTimer);
    saveFlashTimer = setTimeout(() => {
      els.saveStatus.classList.add("hidden");
    }, 1500);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function renderGroceryList() {
    els.groceryList.innerHTML = "";
    CATEGORIES.forEach((cat) => {
      const idsInCategory = state.groceryIds.filter(
        (id) => ITEMS[id].category === cat.key
      );
      if (idsInCategory.length === 0) return;

      const details = document.createElement("details");
      details.open = true;
      const summary = document.createElement("summary");
      summary.textContent = cat.label;
      details.appendChild(summary);

      const ul = document.createElement("ul");
      ul.className = "item-list";
      idsInCategory.forEach((id) => {
        const li = document.createElement("li");

        const row = document.createElement("div");
        row.className = "item-row";

        const label = document.createElement("label");
        label.className = "item-checkbox-label";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = !!state.checked[id];
        checkbox.addEventListener("change", () => {
          state.checked[id] = checkbox.checked;
          span.classList.toggle("checked", checkbox.checked);
          saveState();
        });

        const span = document.createElement("span");
        span.textContent = ITEMS[id].name;
        span.classList.toggle("checked", checkbox.checked);

        label.appendChild(checkbox);
        label.appendChild(span);

        const nutrientKeys = ITEMS[id].nutrients || [];
        const nutrientToggle = document.createElement("button");
        nutrientToggle.type = "button";
        nutrientToggle.className = "nutrient-toggle";
        nutrientToggle.textContent = "ⓘ";
        nutrientToggle.setAttribute("aria-expanded", "false");
        nutrientToggle.setAttribute(
          "aria-label",
          `Show nutrients for ${ITEMS[id].name}`
        );

        const nutrientDetail = document.createElement("div");
        nutrientDetail.className = "item-nutrients hidden";
        nutrientDetail.textContent =
          nutrientKeys.length > 0
            ? `Contains: ${nutrientKeys.map((k) => NUTRIENTS[k]).join(", ")}`
            : "No tracked micronutrients";

        nutrientToggle.addEventListener("click", () => {
          const isHidden = nutrientDetail.classList.toggle("hidden");
          nutrientToggle.setAttribute("aria-expanded", String(!isHidden));
        });

        row.appendChild(label);
        row.appendChild(nutrientToggle);
        li.appendChild(row);
        li.appendChild(nutrientDetail);
        ul.appendChild(li);
      });

      details.appendChild(ul);
      els.groceryList.appendChild(details);
    });
  }

  function buildMealCard(meal, slotIndex, date) {
    const card = document.createElement("div");
    card.className = "meal-card";

    const slotLabel = document.createElement("div");
    slotLabel.className = "meal-slot-label";
    slotLabel.textContent = SLOT_LABELS[slotIndex] || `Meal ${slotIndex + 1}`;

    const badge = document.createElement("span");
    badge.className = `badge badge-${meal.type}`;
    badge.textContent = `${TYPE_LABELS[meal.type]} · ${meal.minMinutes}-${meal.maxMinutes} min`;

    const name = document.createElement("div");
    name.className = "meal-name";
    name.textContent = meal.name;

    const ingredients = document.createElement("div");
    ingredients.className = "meal-ingredients";
    ingredients.textContent = mealIngredients(meal);

    card.appendChild(slotLabel);
    card.appendChild(badge);
    card.appendChild(name);
    card.appendChild(ingredients);

    if (meal.seasoning && meal.seasoning.length > 0) {
      const seasoning = document.createElement("div");
      seasoning.className = "meal-seasoning";
      seasoning.textContent = `Season with: ${meal.seasoning.join(", ")}`;
      card.appendChild(seasoning);
    }

    const regenerateBtn = document.createElement("button");
    regenerateBtn.type = "button";
    regenerateBtn.className = "regenerate-btn";
    regenerateBtn.textContent = "Regenerate";
    regenerateBtn.addEventListener("click", () => regenerateMeal(date, slotIndex));
    card.appendChild(regenerateBtn);

    return card;
  }

  function renderDays() {
    els.fixedBreakfastNote.textContent = `${FIXED_BREAKFAST.label}: ${FIXED_BREAKFAST.items
      .map((id) => ITEMS[id].name)
      .join(" + ")}`;

    els.daysList.innerHTML = "";
    state.days.forEach((d) => {
      const li = document.createElement("li");
      li.className = "day-group";

      const header = document.createElement("div");
      header.className = "day-header";
      header.textContent = formatDateDisplay(d.date);
      li.appendChild(header);

      const dayMeals = document.createElement("div");
      dayMeals.className = "day-meals";

      d.mealIds.forEach((mealId, slotIndex) => {
        const meal = ALL_MEALS.find((m) => m.id === mealId);
        if (!meal) return;
        dayMeals.appendChild(buildMealCard(meal, slotIndex, d.date));
      });

      li.appendChild(dayMeals);
      els.daysList.appendChild(li);
    });
  }

  function nutrientSources(key) {
    return Object.values(ITEMS).filter((item) =>
      (item.nutrients || []).includes(key)
    );
  }

  function showNutrientSources(key) {
    const inListIds = new Set(state.groceryIds);

    els.nutrientSourceDetail.innerHTML = "";

    const label = document.createElement("div");
    label.className = "nutrient-source-label";
    label.textContent = `Foods with ${NUTRIENTS[key]}:`;
    els.nutrientSourceDetail.appendChild(label);

    const list = document.createElement("div");
    list.className = "nutrient-source-list";
    nutrientSources(key).forEach((item) => {
      const tag = document.createElement("span");
      tag.className = `source-tag${inListIds.has(item.id) ? " in-list" : ""}`;
      tag.textContent = item.name;
      list.appendChild(tag);
    });
    els.nutrientSourceDetail.appendChild(list);

    const hint = document.createElement("div");
    hint.className = "nutrient-source-hint";
    hint.textContent = "Highlighted = already in this week's list";
    els.nutrientSourceDetail.appendChild(hint);

    els.nutrientSourceDetail.classList.remove("hidden");
  }

  function renderNutrientCoverage() {
    const covered = computeCoverage(mealsFromDays(state.days));

    els.nutrientSummary.textContent = `${covered.size} / ${NUTRIENT_WATCHLIST.length} covered this week`;

    els.nutrientChips.innerHTML = "";
    els.nutrientSourceDetail.classList.add("hidden");
    els.nutrientSourceDetail.innerHTML = "";

    NUTRIENT_WATCHLIST.forEach((key) => {
      const isCovered = covered.has(key);
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `chip ${isCovered ? "chip-covered" : "chip-missing"}`;
      chip.textContent = `${isCovered ? "✓" : "–"} ${NUTRIENTS[key]}`;
      chip.setAttribute("aria-expanded", "false");

      chip.addEventListener("click", () => {
        const wasActive = chip.classList.contains("chip-active");
        els.nutrientChips.querySelectorAll(".chip-active").forEach((c) => {
          c.classList.remove("chip-active");
          c.setAttribute("aria-expanded", "false");
        });

        if (wasActive) {
          els.nutrientSourceDetail.classList.add("hidden");
          return;
        }

        chip.classList.add("chip-active");
        chip.setAttribute("aria-expanded", "true");
        showNutrientSources(key);
      });

      els.nutrientChips.appendChild(chip);
    });
  }

  function renderOutput() {
    const hasList = state && state.groceryIds.length > 0;
    els.emptyState.classList.toggle("hidden", hasList);
    els.groceryListSection.classList.toggle("hidden", !hasList);
    els.mealsSection.classList.toggle("hidden", !hasList);
    els.nutrientSection.classList.toggle("hidden", !hasList);
    if (hasList) {
      renderGroceryList();
      renderDays();
      renderNutrientCoverage();
    }
  }

  function pruneCheckedAndSave() {
    const newGroceryIds = buildGroceryIds(mealsFromDays(state.days));
    const newGroceryIdSet = new Set(newGroceryIds);
    Object.keys(state.checked).forEach((id) => {
      if (!newGroceryIdSet.has(id)) delete state.checked[id];
    });
    state.groceryIds = newGroceryIds;
    saveState();
    flashSaved();
  }

  function generateWeek() {
    const toggles = readToggles();
    const pool = filterMeals(toggles);
    const totalSlots = DAY_COUNT * MEALS_PER_DAY;
    const meals = improveCoverage(pickMeals(pool, totalSlots), pool);

    const monday = getMondayOfCurrentWeek();
    const days = [];
    for (let i = 0; i < DAY_COUNT; i++) {
      const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const slice = meals.slice(i * MEALS_PER_DAY, i * MEALS_PER_DAY + MEALS_PER_DAY);
      days.push({ date: formatDateISO(date), mealIds: slice.map((m) => m.id) });
    }

    state = {
      toggles,
      days,
      groceryIds: buildGroceryIds(meals),
      checked: {},
    };
    saveState();
    flashSaved();
    renderOutput();
  }

  // Swaps just one meal slot (one day, lunch or dinner), biased toward
  // whatever nutrients the rest of the week is currently missing. Keeps
  // checked-off progress on any grocery item that's still needed; drops
  // items no longer needed.
  function regenerateMeal(date, slotIndex) {
    const toggles = readToggles();
    const pool = filterMeals(toggles);
    const dayEntry = state.days.find((d) => d.date === date);
    if (!dayEntry) return;

    const currentMealId = dayEntry.mealIds[slotIndex];
    const otherMeals = [];
    state.days.forEach((d) => {
      d.mealIds.forEach((id, idx) => {
        if (d.date === date && idx === slotIndex) return;
        const meal = ALL_MEALS.find((m) => m.id === id);
        if (meal) otherMeals.push(meal);
      });
    });

    const replacement = pickBestForGap(pool, otherMeals, currentMealId);
    if (!replacement) return;

    dayEntry.mealIds[slotIndex] = replacement.id;
    state.toggles = toggles;
    pruneCheckedAndSave();
    renderOutput();
  }

  function init() {
    const saved = loadState();
    const toggles = (saved && saved.toggles) || {
      ultraLazy: false,
      highProtein: false,
      extraCheap: false,
      effort: 50,
    };
    applyTogglesToControls(toggles);

    if (saved && saved.groceryIds && saved.groceryIds.length > 0) {
      state = saved;
    } else {
      state = { toggles, days: [], groceryIds: [], checked: {} };
    }
    renderOutput();

    els.generateBtn.addEventListener("click", generateWeek);
    els.ultraLazy.addEventListener("change", () => {
      els.effort.disabled = els.ultraLazy.checked;
    });
    els.effort.addEventListener("input", () => {
      els.effortValue.textContent = els.effort.value;
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
