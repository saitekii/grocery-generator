// Curated food pools and meal templates.
// `cheap` marks items that keep "Extra cheap mode" meals affordable.
// `nutrients` lists the micronutrients each item is a genuinely good source
// of (not exact RDA amounts) - used to nudge weekly meal picks toward
// covering NUTRIENT_WATCHLIST rather than repeating the same few foods.

const PROTEINS = [
  { id: "cannedTuna", name: "Canned tuna", cheap: true, nutrients: ["vitaminB12", "selenium", "vitaminD"] },
  { id: "cannedSalmon", name: "Canned salmon", cheap: false, nutrients: ["omega3", "vitaminD", "vitaminB12", "calcium"] },
  { id: "sardines", name: "Sardines", cheap: true, nutrients: ["omega3", "vitaminD", "calcium", "vitaminB12"] },
  { id: "shrimp", name: "Shrimp (frozen)", cheap: false, nutrients: ["zinc", "selenium", "iodine", "vitaminB12"] },
  { id: "eggs", name: "Eggs", cheap: true, nutrients: ["vitaminD", "vitaminB12", "selenium", "vitaminA"] },
  { id: "tofu", name: "Tofu", cheap: true, nutrients: ["iron", "calcium", "magnesium"] },
  { id: "greekYogurt", name: "Plain Greek yogurt", cheap: true, nutrients: ["calcium", "vitaminB12", "iodine"] },
  { id: "cottageCheese", name: "Cottage cheese", cheap: true, nutrients: ["calcium", "vitaminB12", "selenium"] },
  { id: "blackBeans", name: "Black beans (canned)", cheap: true, nutrients: ["iron", "folate", "magnesium"] },
  { id: "lentils", name: "Lentils", cheap: true, nutrients: ["iron", "folate", "potassium", "zinc"] },
  { id: "kefir", name: "Kefir", cheap: true, nutrients: ["calcium", "vitaminB12", "iodine"] },
];

const CARBS = [
  { id: "oats", name: "Oats", cheap: true, nutrients: ["magnesium", "zinc"] },
  { id: "rice", name: "Rice", cheap: true, nutrients: ["magnesium"] },
  { id: "potatoes", name: "Potatoes", cheap: true, nutrients: ["potassium", "vitaminC"] },
  { id: "wholeGrainBread", name: "Whole grain bread", cheap: true, nutrients: ["magnesium", "iron"] },
  { id: "tortillas", name: "Tortillas", cheap: true, nutrients: ["iron"] },
];

const VEGETABLES = [
  { id: "frozenMixedVeg", name: "Frozen mixed vegetables", cheap: true, nutrients: ["vitaminA", "vitaminC", "potassium"] },
  { id: "frozenBroccoli", name: "Frozen broccoli", cheap: true, nutrients: ["vitaminC", "vitaminK", "folate"] },
  { id: "spinach", name: "Spinach", cheap: true, nutrients: ["iron", "vitaminA", "vitaminK", "magnesium", "folate"] },
  { id: "saladGreens", name: "Salad greens", cheap: true, nutrients: ["vitaminA", "vitaminK", "folate"] },
  { id: "bellPeppers", name: "Bell peppers", cheap: false, nutrients: ["vitaminC", "vitaminA"] },
];

const FRUITS = [
  { id: "frozenBerries", name: "Frozen berries", cheap: true, nutrients: ["vitaminC"] },
  { id: "banana", name: "Banana", cheap: true, nutrients: ["potassium", "vitaminC"] },
  { id: "apple", name: "Apple", cheap: true, nutrients: ["vitaminC"] },
  { id: "frozenMango", name: "Frozen mango", cheap: false, nutrients: ["vitaminA", "vitaminC"] },
];

const FATS = [
  { id: "oliveOil", name: "Olive oil", cheap: true, nutrients: ["vitaminE"] },
  { id: "peanutButter", name: "Peanut butter (no sugar added)", cheap: true, nutrients: ["magnesium", "vitaminE"] },
  { id: "almonds", name: "Almonds", cheap: false, nutrients: ["vitaminE", "magnesium", "calcium"] },
  { id: "avocado", name: "Avocado", cheap: false, nutrients: ["potassium", "vitaminE", "folate", "vitaminK"] },
  { id: "walnuts", name: "Walnuts", cheap: false, nutrients: ["omega3", "magnesium"] },
];

// Practical watchlist: nutrients pescatarians most commonly under-eat,
// not a full RDA table. Order drives display order.
const NUTRIENTS = {
  omega3: "Omega-3",
  vitaminB12: "Vitamin B12",
  vitaminD: "Vitamin D",
  iron: "Iron",
  zinc: "Zinc",
  iodine: "Iodine",
  selenium: "Selenium",
  calcium: "Calcium",
  magnesium: "Magnesium",
  potassium: "Potassium",
  folate: "Folate",
  vitaminA: "Vitamin A",
  vitaminC: "Vitamin C",
  vitaminE: "Vitamin E",
  vitaminK: "Vitamin K",
};

const NUTRIENT_WATCHLIST = Object.keys(NUTRIENTS);

// A fixed daily breakfast the user already eats outside the generator.
// Its items are always added to the grocery list and its nutrients always
// count toward weekly coverage; meals tagged `breakfastStyle` below are
// excluded from generation since they'd just duplicate it.
const FIXED_BREAKFAST = {
  label: "Every day",
  items: ["oats", "peanutButter", "banana", "kefir"],
};

// Category order drives grocery-list display order.
const CATEGORIES = [
  { key: "protein", label: "Protein", items: PROTEINS },
  { key: "carbs", label: "Carbs", items: CARBS },
  { key: "vegetables", label: "Vegetables", items: VEGETABLES },
  { key: "fruit", label: "Fruit", items: FRUITS },
  { key: "fats", label: "Fats", items: FATS },
];

// Flat lookup: id -> { id, name, cheap, nutrients, category }
const ITEMS = {};
CATEGORIES.forEach((cat) => {
  cat.items.forEach((item) => {
    ITEMS[item.id] = { ...item, category: cat.key };
  });
});

const MEALS_NO_COOK = [
  { id: "nc1", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["greekYogurt", "frozenBerries", "almonds"], highProtein: false, breakfastStyle: true },
  { id: "nc2", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["cottageCheese", "banana", "walnuts"], highProtein: true, breakfastStyle: true },
  { id: "nc3", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["sardines", "wholeGrainBread", "saladGreens"], highProtein: true },
  { id: "nc4", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["cannedTuna", "avocado", "tortillas"], highProtein: true },
  { id: "nc5", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["greekYogurt", "peanutButter", "banana"], highProtein: false, breakfastStyle: true },
  { id: "nc6", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["blackBeans", "avocado", "tortillas"], highProtein: false },
  { id: "nc7", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["eggs", "apple", "almonds"], highProtein: true },
];

const MEALS_MICROWAVE = [
  { id: "mw1", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["rice", "cannedTuna", "frozenMixedVeg"], highProtein: true },
  { id: "mw2", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["oats", "peanutButter", "banana"], highProtein: false, breakfastStyle: true },
  { id: "mw3", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["potatoes", "cannedSalmon", "spinach"], highProtein: true },
  { id: "mw4", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["rice", "blackBeans", "frozenBroccoli"], highProtein: false },
  { id: "mw5", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["lentils", "rice", "frozenMixedVeg"], highProtein: false },
  { id: "mw6", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["potatoes", "tofu", "spinach"], highProtein: false },
  { id: "mw7", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["oats", "frozenMango", "peanutButter"], highProtein: false, breakfastStyle: true },
];

const MEALS_QUICK_COOK = [
  { id: "qc1", type: "quick-cook", minMinutes: 5, maxMinutes: 10, items: ["eggs", "spinach", "wholeGrainBread", "oliveOil"], highProtein: true },
  { id: "qc2", type: "quick-cook", minMinutes: 5, maxMinutes: 10, items: ["tofu", "frozenMixedVeg", "rice", "oliveOil"], highProtein: false },
  { id: "qc3", type: "quick-cook", minMinutes: 5, maxMinutes: 10, items: ["shrimp", "rice", "frozenMixedVeg", "oliveOil"], highProtein: true },
  { id: "qc4", type: "quick-cook", minMinutes: 5, maxMinutes: 10, items: ["cannedSalmon", "potatoes", "frozenBroccoli", "oliveOil"], highProtein: true },
  { id: "qc5", type: "quick-cook", minMinutes: 5, maxMinutes: 10, items: ["eggs", "blackBeans", "tortillas", "bellPeppers", "oliveOil"], highProtein: true },
  { id: "qc6", type: "quick-cook", minMinutes: 5, maxMinutes: 10, items: ["shrimp", "tortillas", "bellPeppers", "oliveOil"], highProtein: true },
];

const ALL_MEALS = [...MEALS_NO_COOK, ...MEALS_MICROWAVE, ...MEALS_QUICK_COOK];

// Meals the generator picks from - excludes breakfast-bowl templates that
// would just duplicate FIXED_BREAKFAST.
const GENERATOR_MEALS = ALL_MEALS.filter((m) => !m.breakfastStyle);

const TYPE_LABELS = {
  "no-cook": "No cook",
  microwave: "Microwave",
  "quick-cook": "Quick cook",
};
