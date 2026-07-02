(function () {
  const STORAGE_KEY = "groceryGenerator:v1";
  const MEAL_COUNT = 6;

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
    fixedBreakfastNote: document.getElementById("fixedBreakfastNote"),
    mealsList: document.getElementById("mealsList"),
    nutrientSection: document.getElementById("nutrientSection"),
    nutrientSummary: document.getElementById("nutrientSummary"),
    nutrientChips: document.getElementById("nutrientChips"),
  };

  // { groceryIds: string[], checked: {id: bool}, mealIds: string[], toggles: {...} }
  let state = null;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
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
    let pool = GENERATOR_MEALS.filter((m) => allowedTypes.includes(m.type));

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

  function buildGroceryIds(meals) {
    const seen = new Set(FIXED_BREAKFAST.items);
    meals.forEach((meal) => meal.items.forEach((id) => seen.add(id)));
    return Array.from(seen);
  }

  function mealName(meal) {
    return meal.items.map((id) => ITEMS[id].name).join(" + ");
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
        const label = document.createElement("label");
        label.className = "item-row";

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
        li.appendChild(label);
        ul.appendChild(li);
      });

      details.appendChild(ul);
      els.groceryList.appendChild(details);
    });
  }

  function renderMeals() {
    els.fixedBreakfastNote.textContent = `${FIXED_BREAKFAST.label}: ${FIXED_BREAKFAST.items
      .map((id) => ITEMS[id].name)
      .join(" + ")}`;

    els.mealsList.innerHTML = "";
    state.mealIds.forEach((mealId) => {
      const meal = ALL_MEALS.find((m) => m.id === mealId);
      const li = document.createElement("li");
      li.className = "meal-card";

      const badge = document.createElement("span");
      badge.className = `badge badge-${meal.type}`;
      badge.textContent = `${TYPE_LABELS[meal.type]} · ${meal.minMinutes}-${meal.maxMinutes} min`;

      const name = document.createElement("div");
      name.className = "meal-name";
      name.textContent = mealName(meal);

      li.appendChild(badge);
      li.appendChild(name);
      els.mealsList.appendChild(li);
    });
  }

  function renderNutrientCoverage() {
    const meals = state.mealIds
      .map((id) => ALL_MEALS.find((m) => m.id === id))
      .filter(Boolean);
    const covered = computeCoverage(meals);

    els.nutrientSummary.textContent = `${covered.size} / ${NUTRIENT_WATCHLIST.length} covered this week`;

    els.nutrientChips.innerHTML = "";
    NUTRIENT_WATCHLIST.forEach((key) => {
      const chip = document.createElement("span");
      const isCovered = covered.has(key);
      chip.className = `chip ${isCovered ? "chip-covered" : "chip-missing"}`;
      chip.textContent = `${isCovered ? "✓" : "–"} ${NUTRIENTS[key]}`;
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
      renderMeals();
      renderNutrientCoverage();
    }
  }

  function generateWeek() {
    const toggles = readToggles();
    const pool = filterMeals(toggles);
    const meals = improveCoverage(pickMeals(pool, MEAL_COUNT), pool);
    const groceryIds = buildGroceryIds(meals);

    state = {
      toggles,
      mealIds: meals.map((m) => m.id),
      groceryIds,
      checked: {},
    };
    saveState();
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
      state = { toggles, mealIds: [], groceryIds: [], checked: {} };
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
