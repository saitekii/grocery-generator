App: “Quick Pescatarian Grocery Generator”
Purpose

A personal lightweight web app that generates a weekly grocery list and simple meal ideas optimized for:

Pescatarian diet
Low cost
Minimal cooking effort
Fast meals (mostly 0 to 10 minutes active time)
Low or no added sugar
Whole or minimally processed foods only (no junk food category items)

The goal is not recipe discovery. It is decision removal: “tell me what to buy and what to eat without thinking.”

Core experience

One screen, one primary button:

Generate Week

When clicked, the app outputs:

Grocery list grouped by category
5 to 10 ultra simple meal templates
Optional checkbox list for shopping

Everything is deterministic from a curated food pool, not AI-generated text.

Food rules engine

Every item in the system must pass these constraints:

Allowed foods
Pescatarian proteins: canned fish, eggs, tofu, yogurt, beans, lentils, shrimp
Carbs: oats, rice, potatoes, whole grain bread, tortillas
Vegetables: frozen vegetables, fresh simple vegetables, leafy greens
Fruits: fresh or frozen fruit only
Fats: olive oil, nuts, seeds, avocado, peanut butter (no added sugar versions)
Hard exclusions
Added sugar heavy foods
Candy, chips, desserts, soda
Sugary cereals and snack bars
Highly processed frozen meals
Fast food style items
Constraint philosophy

Processing is allowed only if it improves:

shelf life
convenience
affordability

Not allowed if it primarily increases:

hyper-palatability
sugar/fat/salt engineered reward foods
Meal generator logic

The app randomly builds meals from templates, not freeform AI.

Meal template types

No cook (0 to 3 min)

Greek yogurt + berries + nuts
Cottage cheese + fruit
Sardines + toast

Microwave only (3 to 8 min)

Microwave rice + canned tuna + frozen vegetables
Oatmeal + peanut butter + banana
Microwave potato + canned salmon

Minimal cook (5 to 10 min)

Scrambled eggs + spinach
Tofu + frozen vegetable stir fry
Shrimp + rice + frozen vegetables

Each meal must include:

1 protein
1 carb OR fat
1 fruit or vegetable minimum per meal (flexible for breakfast)
UI layout

Single page app:

Header

“Quick Grocery Generator”

Controls panel
Button: Generate Week
Toggle: Ultra lazy mode (only no-cook meals)
Toggle: High protein mode
Toggle: Extra cheap mode

Optional slider:

Cooking effort (0 to 100)
Output section
Grocery list

Grouped:

Protein
Carbs
Vegetables
Fruit
Fats

Each item has checkbox state saved in localStorage.

Meal plan

Example format:

Day 1

Breakfast: Greek yogurt + berries + nuts
Lunch: Tuna rice bowl with frozen broccoli
Dinner: Scrambled eggs + spinach toast

(But the app can also just show 5 to 7 meals without days if you want it simpler.)

Data structure (important)

Everything is hardcoded arrays:

proteins[]
carbs[]
vegetables[]
fruits[]
fats[]

Plus:

mealsNoCook[]
mealsMicrowave[]
mealsQuickCook[]

The generator just picks combinations based on toggles.

State management

Store in localStorage:

current grocery list
checked items
last generated meals
user toggles

No backend.

Key design principle

This is not a “smart app.”

It is a constraint-based suggestion machine.

The intelligence comes from:

carefully curated food pools
strict exclusion rules
simple meal templates

Not from complexity.