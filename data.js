// Curated food pools and meal templates.
// `cheap` marks items that keep "Extra cheap mode" meals affordable.
// `nutrients` lists the micronutrients each item is a genuinely good source
// of (not exact RDA amounts) - used to nudge weekly meal picks toward
// covering NUTRIENT_WATCHLIST rather than repeating the same few foods.

const PROTEINS = [
  { id: "cannedTuna", name: "Canned tuna", cheap: true, nutrients: ["vitaminB12", "selenium", "vitaminD", "vitaminB3", "vitaminB6"] },
  { id: "cannedSalmon", name: "Canned salmon", cheap: false, nutrients: ["omega3", "vitaminD", "vitaminB12", "calcium", "vitaminB3", "vitaminB6"] },
  { id: "sardines", name: "Sardines", cheap: true, nutrients: ["omega3", "vitaminD", "calcium", "vitaminB12", "vitaminB3"] },
  { id: "shrimp", name: "Shrimp (frozen)", cheap: false, nutrients: ["zinc", "selenium", "iodine", "vitaminB12", "copper"] },
  { id: "eggs", name: "Eggs", cheap: true, nutrients: ["vitaminD", "vitaminB12", "selenium", "vitaminA", "vitaminB2", "choline"] },
  { id: "tofu", name: "Tofu", cheap: true, nutrients: ["iron", "calcium", "magnesium", "manganese", "copper", "choline"] },
  { id: "greekYogurt", name: "Plain Greek yogurt", cheap: true, nutrients: ["calcium", "vitaminB12", "iodine", "vitaminB2"] },
  { id: "cottageCheese", name: "Cottage cheese", cheap: true, nutrients: ["calcium", "vitaminB12", "selenium", "vitaminB2"] },
  { id: "blackBeans", name: "Black beans (canned)", cheap: true, nutrients: ["iron", "folate", "magnesium", "vitaminB1", "manganese"] },
  { id: "lentils", name: "Lentils", cheap: true, nutrients: ["iron", "folate", "potassium", "zinc", "vitaminB1", "manganese"] },
  { id: "kefir", name: "Kefir", cheap: true, nutrients: ["calcium", "vitaminB12", "iodine", "vitaminB2"] },
  { id: "chickpeas", name: "Chickpeas (canned)", cheap: true, nutrients: ["iron", "folate", "zinc", "vitaminB6", "manganese"] },
  { id: "cheddarCheese", name: "Shredded cheddar cheese", cheap: true, nutrients: ["calcium", "vitaminA", "vitaminB2", "vitaminB12"] },
];

const CARBS = [
  { id: "oats", name: "Oats", cheap: true, nutrients: ["magnesium", "zinc", "vitaminB1", "manganese"] },
  { id: "rice", name: "Rice", cheap: true, nutrients: ["magnesium", "manganese"] },
  { id: "potatoes", name: "Potatoes", cheap: true, nutrients: ["potassium", "vitaminC", "vitaminB6"] },
  { id: "wholeGrainBread", name: "Whole grain bread", cheap: true, nutrients: ["magnesium", "iron", "vitaminB1"] },
  { id: "tortillas", name: "Tortillas", cheap: true, nutrients: ["iron"] },
];

const VEGETABLES = [
  { id: "frozenMixedVeg", name: "Frozen mixed vegetables", cheap: true, nutrients: ["vitaminA", "vitaminC", "potassium"] },
  { id: "frozenBroccoli", name: "Frozen broccoli", cheap: true, nutrients: ["vitaminC", "vitaminK", "folate", "manganese"] },
  { id: "spinach", name: "Spinach", cheap: true, nutrients: ["iron", "vitaminA", "vitaminK", "magnesium", "folate", "manganese", "copper"] },
  { id: "saladGreens", name: "Salad greens", cheap: true, nutrients: ["vitaminA", "vitaminK", "folate"] },
  { id: "bellPeppers", name: "Bell peppers", cheap: false, nutrients: ["vitaminC", "vitaminA", "vitaminB6"] },
  { id: "cucumber", name: "Cucumber", cheap: true, nutrients: ["vitaminK"] },
];

const FRUITS = [
  { id: "frozenBerries", name: "Frozen berries", cheap: true, nutrients: ["vitaminC", "manganese"] },
  { id: "banana", name: "Banana", cheap: true, nutrients: ["potassium", "vitaminC", "vitaminB6"] },
  { id: "apple", name: "Apple", cheap: true, nutrients: ["vitaminC"] },
  { id: "frozenMango", name: "Frozen mango", cheap: false, nutrients: ["vitaminA", "vitaminC", "vitaminB6"] },
];

const FATS = [
  { id: "oliveOil", name: "Olive oil", cheap: true, nutrients: ["vitaminE"] },
  { id: "peanutButter", name: "Peanut butter (no sugar added)", cheap: true, nutrients: ["magnesium", "vitaminE", "vitaminB3", "manganese"] },
  { id: "almonds", name: "Almonds", cheap: false, nutrients: ["vitaminE", "magnesium", "calcium", "vitaminB2", "manganese", "copper"] },
  { id: "avocado", name: "Avocado", cheap: false, nutrients: ["potassium", "vitaminE", "folate", "vitaminK", "vitaminB6", "copper"] },
  { id: "walnuts", name: "Walnuts", cheap: false, nutrients: ["omega3", "magnesium", "copper", "manganese"] },
];

// Fresh aromatics that actually get used up and need re-buying - unlike
// dried spices/condiments (cumin, chili powder, soy sauce, salt), which stay
// in a "Season with" note only since most people already keep those stocked.
const PANTRY = [
  { id: "garlic", name: "Garlic", cheap: true, nutrients: ["vitaminB6", "manganese"] },
  { id: "ginger", name: "Ginger", cheap: true, nutrients: ["manganese"] },
  { id: "lemon", name: "Lemon", cheap: true, nutrients: ["vitaminC"] },
  { id: "lime", name: "Lime", cheap: true, nutrients: ["vitaminC"] },
];

// Practical watchlist: nutrients pescatarians most commonly under-eat,
// not a full RDA table. Deliberately excludes nutrients that are
// essentially unavoidable on any whole-food diet (Phosphorus, B5, B7,
// Chromium, Molybdenum) and Sodium, whose real-world risk runs the
// opposite direction (too much, not too little).
// Order drives display order.
const NUTRIENTS = {
  omega3: "Omega-3",
  choline: "Choline",
  vitaminB1: "Vitamin B1",
  vitaminB2: "Vitamin B2",
  vitaminB3: "Vitamin B3",
  vitaminB6: "Vitamin B6",
  folate: "Folate",
  vitaminB12: "Vitamin B12",
  vitaminA: "Vitamin A",
  vitaminC: "Vitamin C",
  vitaminD: "Vitamin D",
  vitaminE: "Vitamin E",
  vitaminK: "Vitamin K",
  calcium: "Calcium",
  iron: "Iron",
  magnesium: "Magnesium",
  potassium: "Potassium",
  zinc: "Zinc",
  copper: "Copper",
  manganese: "Manganese",
  iodine: "Iodine",
  selenium: "Selenium",
};

const NUTRIENT_WATCHLIST = Object.keys(NUTRIENTS);

// A fixed daily breakfast the user already eats outside the generator.
// Its items are always added to the grocery list and its nutrients always
// count toward weekly coverage.
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
  { key: "pantry", label: "Pantry", items: PANTRY },
];

// Flat lookup: id -> { id, name, cheap, nutrients, category }
const ITEMS = {};
CATEGORIES.forEach((cat) => {
  cat.items.forEach((item) => {
    ITEMS[item.id] = { ...item, category: cat.key };
  });
});

const MEALS_NO_COOK = [
  { id: "nc3", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["sardines", "wholeGrainBread", "saladGreens", "lemon"], highProtein: true, name: "Sardines on toast", seasoning: ["lemon", "black pepper"] },
  { id: "nc4", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["cannedTuna", "avocado", "tortillas", "saladGreens", "lemon"], highProtein: true, name: "Tuna avocado wrap", seasoning: ["lemon", "black pepper"] },
  { id: "nc6", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["blackBeans", "avocado", "tortillas", "bellPeppers", "lime"], highProtein: false, name: "Black bean & avocado wrap", seasoning: ["lime", "chili powder"] },
  { id: "nc7", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["eggs", "apple", "almonds"], highProtein: true, name: "Protein snack plate", seasoning: ["sea salt"] },
  { id: "nc8", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["chickpeas", "cucumber", "oliveOil", "lemon"], highProtein: false, name: "Chickpea cucumber salad", seasoning: ["lemon", "salt", "black pepper"] },
  { id: "nc9", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["cannedSalmon", "cucumber", "wholeGrainBread", "lemon"], highProtein: true, name: "Salmon salad sandwich", seasoning: ["lemon", "dill", "black pepper"] },
  { id: "nc10", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["cannedTuna", "blackBeans", "bellPeppers", "oliveOil"], highProtein: true, name: "Tuna & bean salad", seasoning: ["red wine vinegar", "black pepper"] },
  { id: "nc11", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["cottageCheese", "cucumber", "oliveOil"], highProtein: true, name: "Savory cottage cheese bowl", seasoning: ["black pepper", "chili flakes"] },
  { id: "nc12", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["greekYogurt", "cucumber", "oliveOil", "garlic", "lemon"], highProtein: false, name: "Cucumber yogurt salad", seasoning: ["garlic", "lemon", "dill"] },
  { id: "nc13", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["chickpeas", "spinach", "frozenBerries", "walnuts", "oliveOil"], highProtein: false, name: "Berry spinach salad", seasoning: ["black pepper"] },
];

const MEALS_MICROWAVE = [
  { id: "mw1", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["rice", "cannedTuna", "frozenMixedVeg"], highProtein: true, name: "Tuna rice bowl", seasoning: ["soy sauce", "garlic powder"] },
  { id: "mw3", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["potatoes", "cannedSalmon", "spinach", "lemon"], highProtein: true, name: "Loaded jacket potato with salmon", seasoning: ["black pepper", "lemon"] },
  { id: "mw4", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["rice", "blackBeans", "frozenBroccoli"], highProtein: false, name: "Rice & beans bowl", seasoning: ["cumin", "chili powder"] },
  { id: "mw5", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["lentils", "rice", "frozenMixedVeg"], highProtein: false, name: "Lentil & rice bowl", seasoning: ["cumin", "turmeric"] },
  { id: "mw6", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["rice", "eggs", "frozenMixedVeg"], highProtein: true, name: "Egg fried rice", seasoning: ["soy sauce", "garlic powder", "black pepper"] },
  { id: "mw8", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["rice", "chickpeas", "frozenMixedVeg"], highProtein: false, name: "Chickpea rice bowl", seasoning: ["curry powder", "garlic powder"] },
  { id: "mw9", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["potatoes", "blackBeans", "bellPeppers", "cheddarCheese"], highProtein: false, name: "Loaded baked potato", seasoning: ["chili powder", "black pepper"] },
  { id: "mw10", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["rice", "shrimp", "frozenBroccoli"], highProtein: true, name: "Shrimp & broccoli rice bowl", seasoning: ["soy sauce", "garlic powder"] },
];

const MEALS_QUICK_COOK = [
  { id: "qc1", type: "quick-cook", minMinutes: 5, maxMinutes: 10, items: ["eggs", "spinach", "wholeGrainBread", "oliveOil"], highProtein: true, name: "Scrambled eggs & spinach on toast", seasoning: ["black pepper", "chili flakes"] },
  { id: "qc2", type: "quick-cook", minMinutes: 5, maxMinutes: 10, items: ["tofu", "frozenMixedVeg", "rice", "oliveOil", "garlic", "ginger"], highProtein: false, name: "Tofu vegetable stir fry", seasoning: ["soy sauce", "garlic", "ginger"] },
  { id: "qc3", type: "quick-cook", minMinutes: 5, maxMinutes: 10, items: ["shrimp", "rice", "frozenMixedVeg", "oliveOil", "garlic"], highProtein: true, name: "Shrimp stir fry", seasoning: ["soy sauce", "garlic"] },
  { id: "qc4", type: "quick-cook", minMinutes: 5, maxMinutes: 10, items: ["cannedSalmon", "potatoes", "frozenBroccoli", "oliveOil", "lemon"], highProtein: true, name: "Pan-seared salmon with potatoes & broccoli", seasoning: ["lemon", "black pepper", "dill"] },
  { id: "qc5", type: "quick-cook", minMinutes: 5, maxMinutes: 10, items: ["eggs", "blackBeans", "tortillas", "bellPeppers", "oliveOil", "cheddarCheese"], highProtein: true, name: "Egg & black bean breakfast tacos", seasoning: ["cumin", "hot sauce"] },
  { id: "qc6", type: "quick-cook", minMinutes: 5, maxMinutes: 10, items: ["shrimp", "tortillas", "bellPeppers", "oliveOil", "lime"], highProtein: true, name: "Shrimp fajita tacos", seasoning: ["chili powder", "lime"] },
  { id: "qc7", type: "quick-cook", minMinutes: 5, maxMinutes: 10, items: ["shrimp", "potatoes", "spinach", "oliveOil", "garlic"], highProtein: true, name: "Garlic shrimp & potato skillet", seasoning: ["garlic", "black pepper"] },
  { id: "qc8", type: "quick-cook", minMinutes: 5, maxMinutes: 10, items: ["tofu", "rice", "bellPeppers", "oliveOil", "garlic"], highProtein: false, name: "Tofu & pepper stir fry", seasoning: ["soy sauce", "garlic"] },
  { id: "qc9", type: "quick-cook", minMinutes: 5, maxMinutes: 10, items: ["shrimp", "rice", "frozenMango", "bellPeppers", "oliveOil", "lime"], highProtein: true, name: "Shrimp & mango rice bowl", seasoning: ["lime", "chili powder", "cilantro"] },
];

const ALL_MEALS = [...MEALS_NO_COOK, ...MEALS_MICROWAVE, ...MEALS_QUICK_COOK];

const TYPE_LABELS = {
  "no-cook": "No cook",
  microwave: "Microwave",
  "quick-cook": "Quick cook",
};
