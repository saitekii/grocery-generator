(function () {
  const STORAGE_KEY = "groceryGenerator:v4";
  const DAY_COUNT = 7;
  const MEALS_PER_DAY = 2;
  const SLOT_LABELS = ["Lunch", "Dinner"];
  const STYLE_OPTIONS = [
    { value: "no-cook", label: "No-cook" },
    { value: "microwave", label: "Micro" },
    { value: "quick-cook", label: "Cook" },
  ];

  const els = {
    saveStatus: document.getElementById("saveStatus"),

    tabButtons: document.querySelectorAll(".tab-btn"),
    planPanel: document.getElementById("planPanel"),
    groceryPanel: document.getElementById("groceryPanel"),
    savedPanel: document.getElementById("savedPanel"),

    prevWeekBtn: document.getElementById("prevWeekBtn"),
    nextWeekBtn: document.getElementById("nextWeekBtn"),
    weekRangeLabel: document.getElementById("weekRangeLabel"),
    generateBtn: document.getElementById("generateBtn"),
    emptyState: document.getElementById("emptyState"),
    mealsSection: document.getElementById("mealsSection"),
    fixedBreakfastNote: document.getElementById("fixedBreakfastNote"),
    daysList: document.getElementById("daysList"),
    nutrientSection: document.getElementById("nutrientSection"),
    nutrientSummary: document.getElementById("nutrientSummary"),
    nutrientChips: document.getElementById("nutrientChips"),
    nutrientSourceDetail: document.getElementById("nutrientSourceDetail"),

    groceryWeekLabel: document.getElementById("groceryWeekLabel"),
    groceryListSection: document.getElementById("groceryListSection"),
    groceryList: document.getElementById("groceryList"),
    groceryEmptyState: document.getElementById("groceryEmptyState"),

    savedWeeksCount: document.getElementById("savedWeeksCount"),
    weeksList: document.getElementById("weeksList"),
    savedEmptyState: document.getElementById("savedEmptyState"),
  };

  // {
  //   activeWeekStart: "yyyy-mm-dd" (a Monday),
  //   weeks: {
  //     "yyyy-mm-dd": {
  //       days: [{ date, meals: [{ mealId, prefs: {style, highProtein, cheap} }, ...] }, ...],
  //       groceryIds: string[],
  //       checked: {id: bool}
  //     }
  //   }
  // }
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

  function parseISO(isoDateStr) {
    const [y, m, d] = isoDateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function addDaysISO(isoDateStr, days) {
    const base = parseISO(isoDateStr);
    return formatDateISO(new Date(base.getFullYear(), base.getMonth(), base.getDate() + days));
  }

  // Monday of the calendar week containing today (ISO-style week start).
  function getMondayOfCurrentWeek() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday ... 6 = Saturday
    const diffToMonday = day === 0 ? -6 : 1 - day;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
  }

  function formatDateDisplay(isoDateStr) {
    return parseISO(isoDateStr).toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }

  function formatWeekRange(weekStart) {
    const start = parseISO(weekStart);
    const end = parseISO(addDaysISO(weekStart, 6));
    const startLabel = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const endLabel = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${startLabel} – ${endLabel}`;
  }

  function defaultPrefs() {
    return { style: null, highProtein: false, cheap: false };
  }

  function isCheapMeal(meal) {
    return meal.items.every((id) => ITEMS[id].cheap);
  }

  // Per-meal-slot pool: style is an exclusive filter (or unconstrained if
  // null), highProtein/cheap narrow further with the same
  // fall-back-if-it-would-empty-the-pool pattern.
  function filterMealsForSlot(prefs) {
    let pool = ALL_MEALS;
    if (prefs.style) {
      pool = pool.filter((m) => m.type === prefs.style);
    }
    if (prefs.highProtein) {
      const narrowed = pool.filter((m) => m.highProtein);
      if (narrowed.length > 0) pool = narrowed;
    }
    if (prefs.cheap) {
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
  // watchlist nutrients, so a fresh week isn't just random - it also nudges
  // toward broader micronutrient coverage. Used for the bulk "Generate Week"
  // fill, which always draws from the full unconstrained pool.
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
  // candidate (from that slot's own preference-filtered pool) newly covers
  // the most nutrients still missing across every *other* scheduled meal in
  // the week + fixed breakfast, and isn't already used elsewhere in the
  // week if that can be avoided.
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
      d.meals.forEach((slot) => {
        const meal = ALL_MEALS.find((m) => m.id === slot.mealId);
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

  function getActiveWeek() {
    return state.weeks[state.activeWeekStart] || null;
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

  function pruneCheckedAndSave(week) {
    const newGroceryIds = buildGroceryIds(mealsFromDays(week.days));
    const newGroceryIdSet = new Set(newGroceryIds);
    Object.keys(week.checked).forEach((id) => {
      if (!newGroceryIdSet.has(id)) delete week.checked[id];
    });
    week.groceryIds = newGroceryIds;
    saveState();
    flashSaved();
  }

  function generateWeek() {
    const totalSlots = DAY_COUNT * MEALS_PER_DAY;
    const meals = improveCoverage(pickMeals(ALL_MEALS, totalSlots), ALL_MEALS);

    const weekStart = state.activeWeekStart;
    const days = [];
    for (let i = 0; i < DAY_COUNT; i++) {
      const date = addDaysISO(weekStart, i);
      const slice = meals.slice(i * MEALS_PER_DAY, i * MEALS_PER_DAY + MEALS_PER_DAY);
      days.push({
        date,
        meals: slice.map((m) => ({ mealId: m.id, prefs: defaultPrefs() })),
      });
    }

    state.weeks[weekStart] = {
      days,
      groceryIds: buildGroceryIds(meals),
      checked: {},
    };
    saveState();
    flashSaved();
    renderAll();
  }

  // Swaps just one meal slot using that slot's own preference chips (cook
  // style, high protein, cheap), biased toward whatever nutrients the rest
  // of the week is currently missing, and avoiding a meal already used
  // elsewhere in the week where the filtered pool allows it. Preserves
  // checked-off grocery progress for anything still needed.
  function regenerateMeal(date, slotIndex) {
    const week = getActiveWeek();
    if (!week) return;
    const dayEntry = week.days.find((d) => d.date === date);
    if (!dayEntry) return;
    const slot = dayEntry.meals[slotIndex];
    if (!slot) return;

    const pool = filterMealsForSlot(slot.prefs);
    const otherMeals = [];
    week.days.forEach((d) => {
      d.meals.forEach((s, idx) => {
        if (d.date === date && idx === slotIndex) return;
        const meal = ALL_MEALS.find((m) => m.id === s.mealId);
        if (meal) otherMeals.push(meal);
      });
    });

    const replacement = pickBestForGap(pool, otherMeals, slot.mealId);
    if (!replacement) return;

    slot.mealId = replacement.id;
    pruneCheckedAndSave(week);
    renderAll();
  }

  // Sets a slot's cook-style filter for its *next* regenerate; tapping the
  // already-active option clears it back to unconstrained. Doesn't change
  // the currently-assigned meal by itself.
  function toggleSlotStyle(date, slotIndex, styleValue) {
    const week = getActiveWeek();
    if (!week) return;
    const dayEntry = week.days.find((d) => d.date === date);
    const slot = dayEntry && dayEntry.meals[slotIndex];
    if (!slot) return;
    slot.prefs.style = slot.prefs.style === styleValue ? null : styleValue;
    saveState();
    renderAll();
  }

  function toggleSlotFlag(date, slotIndex, key) {
    const week = getActiveWeek();
    if (!week) return;
    const dayEntry = week.days.find((d) => d.date === date);
    const slot = dayEntry && dayEntry.meals[slotIndex];
    if (!slot) return;
    slot.prefs[key] = !slot.prefs[key];
    saveState();
    renderAll();
  }

  function navigateWeek(delta) {
    state.activeWeekStart = addDaysISO(state.activeWeekStart, delta * 7);
    saveState();
    renderAll();
  }

  function switchTab(tabId) {
    els.tabButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tabId);
    });
    [els.planPanel, els.groceryPanel, els.savedPanel].forEach((panel) => {
      panel.classList.toggle("hidden", panel.id !== tabId);
    });
  }

  function buildMealCard(meal, slot, slotIndex, date) {
    const card = document.createElement("div");
    card.className = "meal-card";

    const slotRow = document.createElement("div");
    slotRow.className = "slot-row";
    const slotLabelEl = document.createElement("span");
    slotLabelEl.className = "meal-slot-label";
    slotLabelEl.textContent = SLOT_LABELS[slotIndex] || `Meal ${slotIndex + 1}`;
    const badge = document.createElement("span");
    badge.className = `badge badge-${meal.type}`;
    badge.textContent = `${TYPE_LABELS[meal.type]} · ${meal.minMinutes}-${meal.maxMinutes} min`;
    slotRow.appendChild(slotLabelEl);
    slotRow.appendChild(badge);
    card.appendChild(slotRow);

    const name = document.createElement("div");
    name.className = "meal-name";
    name.textContent = meal.name;
    card.appendChild(name);

    const ingredients = document.createElement("div");
    ingredients.className = "meal-ingredients";
    ingredients.textContent = mealIngredients(meal);
    card.appendChild(ingredients);

    if (meal.seasoning && meal.seasoning.length > 0) {
      const seasoning = document.createElement("div");
      seasoning.className = "meal-seasoning";
      seasoning.textContent = `Season with: ${meal.seasoning.join(", ")}`;
      card.appendChild(seasoning);
    }

    const controls = document.createElement("div");
    controls.className = "meal-controls";

    const styleToggle = document.createElement("div");
    styleToggle.className = "style-toggle";
    STYLE_OPTIONS.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = opt.label;
      btn.className = slot.prefs.style === opt.value ? "active" : "";
      btn.addEventListener("click", () => toggleSlotStyle(date, slotIndex, opt.value));
      styleToggle.appendChild(btn);
    });
    controls.appendChild(styleToggle);

    const proteinChip = document.createElement("button");
    proteinChip.type = "button";
    proteinChip.className = `pref-chip${slot.prefs.highProtein ? " active" : ""}`;
    proteinChip.textContent = "High protein";
    proteinChip.addEventListener("click", () => toggleSlotFlag(date, slotIndex, "highProtein"));
    controls.appendChild(proteinChip);

    const cheapChip = document.createElement("button");
    cheapChip.type = "button";
    cheapChip.className = `pref-chip${slot.prefs.cheap ? " active" : ""}`;
    cheapChip.textContent = "Cheap";
    cheapChip.addEventListener("click", () => toggleSlotFlag(date, slotIndex, "cheap"));
    controls.appendChild(cheapChip);

    card.appendChild(controls);

    const regenerateBtn = document.createElement("button");
    regenerateBtn.type = "button";
    regenerateBtn.className = "regenerate-btn";
    regenerateBtn.textContent = "Regenerate";
    regenerateBtn.addEventListener("click", () => regenerateMeal(date, slotIndex));
    card.appendChild(regenerateBtn);

    return card;
  }

  function nutrientSources(key) {
    return Object.values(ITEMS).filter((item) =>
      (item.nutrients || []).includes(key)
    );
  }

  function showNutrientSources(key) {
    const week = getActiveWeek();
    const inListIds = new Set(week ? week.groceryIds : []);

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

  function renderNutrientCoverage(week) {
    const covered = computeCoverage(mealsFromDays(week.days));

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

  function renderPlan() {
    els.weekRangeLabel.textContent = formatWeekRange(state.activeWeekStart);
    const week = getActiveWeek();
    const hasDays = !!(week && week.days.length > 0);

    els.emptyState.classList.toggle("hidden", hasDays);
    els.mealsSection.classList.toggle("hidden", !hasDays);
    els.nutrientSection.classList.toggle("hidden", !hasDays);

    if (!hasDays) return;

    els.fixedBreakfastNote.textContent = `${FIXED_BREAKFAST.label}: ${FIXED_BREAKFAST.items
      .map((id) => ITEMS[id].name)
      .join(" + ")}`;

    els.daysList.innerHTML = "";
    week.days.forEach((d) => {
      const li = document.createElement("li");
      li.className = "day-group";

      const header = document.createElement("div");
      header.className = "day-header";
      header.textContent = formatDateDisplay(d.date);
      li.appendChild(header);

      const dayMeals = document.createElement("div");
      dayMeals.className = "day-meals";

      d.meals.forEach((slot, slotIndex) => {
        const meal = ALL_MEALS.find((m) => m.id === slot.mealId);
        if (!meal) return;
        dayMeals.appendChild(buildMealCard(meal, slot, slotIndex, d.date));
      });

      li.appendChild(dayMeals);
      els.daysList.appendChild(li);
    });

    renderNutrientCoverage(week);
  }

  function renderGroceryPanel() {
    els.groceryWeekLabel.textContent = `Week of ${formatWeekRange(state.activeWeekStart)}`;
    const week = getActiveWeek();
    const hasList = !!(week && week.groceryIds.length > 0);

    els.groceryListSection.classList.toggle("hidden", !hasList);
    els.groceryEmptyState.classList.toggle("hidden", hasList);

    if (!hasList) return;

    els.groceryList.innerHTML = "";
    CATEGORIES.forEach((cat) => {
      const idsInCategory = week.groceryIds.filter((id) => ITEMS[id].category === cat.key);
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
        checkbox.checked = !!week.checked[id];
        checkbox.addEventListener("change", () => {
          week.checked[id] = checkbox.checked;
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

  function renderSavedWeeksPanel() {
    const weekStarts = Object.keys(state.weeks).sort();
    els.savedWeeksCount.textContent =
      weekStarts.length === 0
        ? ""
        : weekStarts.length === 1
        ? "1 week saved"
        : `${weekStarts.length} weeks saved`;

    els.weeksList.innerHTML = "";
    els.savedEmptyState.classList.toggle("hidden", weekStarts.length > 0);

    weekStarts.forEach((ws) => {
      const week = state.weeks[ws];
      const meals = mealsFromDays(week.days);

      const li = document.createElement("li");
      li.className = `week-entry${ws === state.activeWeekStart ? " active" : ""}`;
      li.tabIndex = 0;
      li.setAttribute("role", "button");

      const info = document.createElement("div");
      const range = document.createElement("div");
      range.className = "week-entry-range";
      range.textContent = formatWeekRange(ws);
      const meta = document.createElement("div");
      meta.className = "week-entry-meta";
      if (meals.length > 0) {
        const covered = computeCoverage(meals);
        meta.textContent = `${meals.length} meals · ${covered.size}/${NUTRIENT_WATCHLIST.length} covered`;
      } else {
        meta.textContent = "Empty";
      }
      info.appendChild(range);
      info.appendChild(meta);

      const pill = document.createElement("span");
      pill.className = "week-entry-pill";
      pill.textContent = ws === state.activeWeekStart ? "Viewing" : "Open";

      li.appendChild(info);
      li.appendChild(pill);

      const openWeek = () => {
        state.activeWeekStart = ws;
        saveState();
        switchTab("planPanel");
        renderAll();
      };
      li.addEventListener("click", openWeek);
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openWeek();
        }
      });

      els.weeksList.appendChild(li);
    });
  }

  function renderAll() {
    renderPlan();
    renderGroceryPanel();
    renderSavedWeeksPanel();
  }

  function init() {
    const saved = loadState();
    if (saved && saved.weeks && saved.activeWeekStart) {
      state = saved;
    } else {
      state = { activeWeekStart: formatDateISO(getMondayOfCurrentWeek()), weeks: {} };
    }

    renderAll();

    els.generateBtn.addEventListener("click", generateWeek);
    els.prevWeekBtn.addEventListener("click", () => navigateWeek(-1));
    els.nextWeekBtn.addEventListener("click", () => navigateWeek(1));
    els.tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
