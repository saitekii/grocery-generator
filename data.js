// Curated food pools and meal templates.
// `cheap` marks items that keep "Extra cheap mode" meals affordable.

const PROTEINS = [
  { id: "cannedTuna", name: "Canned tuna", cheap: true },
  { id: "cannedSalmon", name: "Canned salmon", cheap: false },
  { id: "sardines", name: "Sardines", cheap: true },
  { id: "shrimp", name: "Shrimp (frozen)", cheap: false },
  { id: "eggs", name: "Eggs", cheap: true },
  { id: "tofu", name: "Tofu", cheap: true },
  { id: "greekYogurt", name: "Plain Greek yogurt", cheap: true },
  { id: "cottageCheese", name: "Cottage cheese", cheap: true },
  { id: "blackBeans", name: "Black beans (canned)", cheap: true },
  { id: "lentils", name: "Lentils", cheap: true },
];

const CARBS = [
  { id: "oats", name: "Oats", cheap: true },
  { id: "rice", name: "Rice", cheap: true },
  { id: "potatoes", name: "Potatoes", cheap: true },
  { id: "wholeGrainBread", name: "Whole grain bread", cheap: true },
  { id: "tortillas", name: "Tortillas", cheap: true },
];

const VEGETABLES = [
  { id: "frozenMixedVeg", name: "Frozen mixed vegetables", cheap: true },
  { id: "frozenBroccoli", name: "Frozen broccoli", cheap: true },
  { id: "spinach", name: "Spinach", cheap: true },
  { id: "saladGreens", name: "Salad greens", cheap: true },
  { id: "bellPeppers", name: "Bell peppers", cheap: false },
];

const FRUITS = [
  { id: "frozenBerries", name: "Frozen berries", cheap: true },
  { id: "banana", name: "Banana", cheap: true },
  { id: "apple", name: "Apple", cheap: true },
  { id: "frozenMango", name: "Frozen mango", cheap: false },
];

const FATS = [
  { id: "oliveOil", name: "Olive oil", cheap: true },
  { id: "peanutButter", name: "Peanut butter (no sugar added)", cheap: true },
  { id: "almonds", name: "Almonds", cheap: false },
  { id: "avocado", name: "Avocado", cheap: false },
  { id: "walnuts", name: "Walnuts", cheap: false },
];

// Category order drives grocery-list display order.
const CATEGORIES = [
  { key: "protein", label: "Protein", items: PROTEINS },
  { key: "carbs", label: "Carbs", items: CARBS },
  { key: "vegetables", label: "Vegetables", items: VEGETABLES },
  { key: "fruit", label: "Fruit", items: FRUITS },
  { key: "fats", label: "Fats", items: FATS },
];

// Flat lookup: id -> { id, name, cheap, category }
const ITEMS = {};
CATEGORIES.forEach((cat) => {
  cat.items.forEach((item) => {
    ITEMS[item.id] = { ...item, category: cat.key };
  });
});

const MEALS_NO_COOK = [
  { id: "nc1", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["greekYogurt", "frozenBerries", "almonds"], highProtein: false },
  { id: "nc2", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["cottageCheese", "banana", "walnuts"], highProtein: true },
  { id: "nc3", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["sardines", "wholeGrainBread", "saladGreens"], highProtein: true },
  { id: "nc4", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["cannedTuna", "avocado", "tortillas"], highProtein: true },
  { id: "nc5", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["greekYogurt", "peanutButter", "banana"], highProtein: false },
  { id: "nc6", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["blackBeans", "avocado", "tortillas"], highProtein: false },
  { id: "nc7", type: "no-cook", minMinutes: 0, maxMinutes: 3, items: ["eggs", "apple", "almonds"], highProtein: true },
];

const MEALS_MICROWAVE = [
  { id: "mw1", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["rice", "cannedTuna", "frozenMixedVeg"], highProtein: true },
  { id: "mw2", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["oats", "peanutButter", "banana"], highProtein: false },
  { id: "mw3", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["potatoes", "cannedSalmon", "spinach"], highProtein: true },
  { id: "mw4", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["rice", "blackBeans", "frozenBroccoli"], highProtein: false },
  { id: "mw5", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["lentils", "rice", "frozenMixedVeg"], highProtein: false },
  { id: "mw6", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["potatoes", "tofu", "spinach"], highProtein: false },
  { id: "mw7", type: "microwave", minMinutes: 3, maxMinutes: 8, items: ["oats", "frozenMango", "peanutButter"], highProtein: false },
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

const TYPE_LABELS = {
  "no-cook": "No cook",
  microwave: "Microwave",
  "quick-cook": "Quick cook",
};
