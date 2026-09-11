// ─────────────────────────────────────────────────────────────
// data/food-items.ts
// ─────────────────────────────────────────────────────────────

export interface Ingredient {
  id: string;
  quantity?: number;
  unit?: string;
  name: string;
  preparation?: string;
  isOptional?: boolean;
}

export interface CookingStep {
  id: string;
  instruction: string;
  durationMinutes?: number;
  targetTempC?: number;
}

// ─────────────────────────────────────────────────────────────
// data/food-items.ts  — add these to your existing file
// ─────────────────────────────────────────────────────────────

export interface FoodPhoto {
  id: string;
  uri: string;
  caption?: string;
  takenAt?: number;
}

export interface FoodItem {
  id: string;
  title: string;
  description: string;
  imageUri?: string;
  source: "created" | "forked";
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  ingredients: Ingredient[];
  steps: CookingStep[];
  photos: FoodPhoto[]; // ← new: final-dish gallery
}

export const FOOD_ITEMS: FoodItem[] = [
  {
    id: "1",
    title: "Chicken Adobo",
    description:
      "Filipino braised chicken in soy, vinegar, garlic, and bay leaf. Deeply savory with a tangy finish — the kind of dish that tastes even better the next day.",
    imageUri:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=1200",
    source: "created",
    servings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 45,
    photos: [
      {
        id: "p1",
        uri: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600",
        caption: "First try — sauce reduced a bit too much",
      },
      {
        id: "p2",
        uri: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600",
        caption: "Sunday dinner, extra garlic",
      },
      {
        id: "p3",
        uri: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600",
      },
      {
        id: "p4",
        uri: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
        caption: "Served over garlic rice",
      },
    ],
    ingredients: [
      {
        id: "i1",
        quantity: 1,
        unit: "kg",
        name: "chicken thighs",
        preparation: "bone-in, skin-on",
      },
      { id: "i2", quantity: 0.5, unit: "cup", name: "soy sauce" },
      { id: "i3", quantity: 0.5, unit: "cup", name: "cane vinegar" },
      {
        id: "i4",
        quantity: 1,
        unit: "head",
        name: "garlic",
        preparation: "peeled, smashed",
      },
      { id: "i5", quantity: 3, name: "bay leaves" },
      {
        id: "i6",
        quantity: 1,
        unit: "tbsp",
        name: "black peppercorns",
        preparation: "cracked",
      },
      { id: "i7", quantity: 1, unit: "tbsp", name: "brown sugar" },
      { id: "i8", quantity: 1, unit: "cup", name: "water" },
      { id: "i9", name: "salt", isOptional: true },
    ],
    steps: [
      {
        id: "s1",
        instruction:
          "Pat the chicken dry and season lightly with salt. Let it sit at room temperature for 10 minutes.",
      },
      {
        id: "s2",
        instruction:
          "Heat a large pan over medium-high heat. Sear the chicken skin-side down until deep golden, about 6 minutes per side.",
        durationMinutes: 12,
      },
      {
        id: "s3",
        instruction: "Add the garlic and sauté until fragrant, about 1 minute.",
        durationMinutes: 1,
      },
      {
        id: "s4",
        instruction:
          "Pour in the soy sauce, vinegar, and water. Add bay leaves, peppercorns, and sugar. Bring to a simmer.",
      },
      {
        id: "s5",
        instruction:
          "Cover and simmer on low until the chicken is tender and the sauce has reduced, about 25 minutes.",
        durationMinutes: 25,
      },
      {
        id: "s6",
        instruction:
          "Uncover and reduce the sauce further until it coats the back of a spoon.",
        durationMinutes: 5,
      },
      { id: "s7", instruction: "Serve hot over steamed rice." },
    ],
  },
  {
    id: "2",
    title: "Miso Ramen Broth",
    description:
      "Rich, umami-packed broth with white miso, dashi, and toasted sesame. Perfect for weeknight ramen when you want something deeply satisfying without a full day of cooking.",
    imageUri:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200",
    source: "forked",
    servings: 2,
    prepTimeMinutes: 10,
    cookTimeMinutes: 30,
    photos: [
      {
        id: "p1",
        uri: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600",
        caption: "First try — sauce reduced a bit too much",
      },
      {
        id: "p2",
        uri: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600",
        caption: "Sunday dinner, extra garlic",
      },
      {
        id: "p3",
        uri: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600",
      },
      {
        id: "p4",
        uri: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
        caption: "Served over garlic rice",
      },
    ],
    ingredients: [
      { id: "i1", quantity: 4, unit: "cups", name: "chicken stock" },
      { id: "i2", quantity: 3, unit: "tbsp", name: "white miso paste" },
      { id: "i3", quantity: 1, unit: "tbsp", name: "toasted sesame oil" },
      {
        id: "i4",
        quantity: 2,
        unit: "cloves",
        name: "garlic",
        preparation: "minced",
      },
      {
        id: "i5",
        quantity: 1,
        unit: "inch",
        name: "ginger",
        preparation: "grated",
      },
      {
        id: "i6",
        quantity: 1,
        unit: "tsp",
        name: "chili oil",
        isOptional: true,
      },
      { id: "i7", quantity: 2, unit: "tbsp", name: "soy sauce" },
    ],
    steps: [
      {
        id: "s1",
        instruction:
          "Heat sesame oil in a pot over medium heat. Add garlic and ginger, sauté until fragrant.",
        durationMinutes: 2,
      },
      {
        id: "s2",
        instruction: "Add the chicken stock and bring to a gentle simmer.",
      },
      {
        id: "s3",
        instruction:
          "Whisk the miso paste with a ladle of hot broth in a small bowl until smooth, then stir it back into the pot.",
      },
      {
        id: "s4",
        instruction:
          "Add soy sauce and chili oil. Simmer gently for 15 minutes — do not boil, or the miso turns grainy.",
        durationMinutes: 15,
      },
      {
        id: "s5",
        instruction:
          "Taste and adjust. Serve over fresh ramen noodles with your favorite toppings.",
      },
    ],
  },
  {
    id: "3",
    title: "Basil Pesto",
    description:
      "Classic Genovese pesto — fresh basil, pine nuts, parmesan, and good olive oil. Freezes beautifully in ice cube trays for single-serving portions.",
    source: "created",
    servings: 6,
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    photos: [
      {
        id: "p1",
        uri: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600",
        caption: "First try — sauce reduced a bit too much",
      },
      {
        id: "p2",
        uri: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600",
        caption: "Sunday dinner, extra garlic",
      },
      {
        id: "p3",
        uri: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600",
      },
      {
        id: "p4",
        uri: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600",
        caption: "Served over garlic rice",
      },
    ],
    ingredients: [
      {
        id: "i1",
        quantity: 2,
        unit: "cups",
        name: "fresh basil leaves",
        preparation: "packed",
      },
      {
        id: "i2",
        quantity: 0.33,
        unit: "cup",
        name: "pine nuts",
        preparation: "toasted",
      },
      {
        id: "i3",
        quantity: 0.5,
        unit: "cup",
        name: "parmesan",
        preparation: "finely grated",
      },
      { id: "i4", quantity: 2, unit: "cloves", name: "garlic" },
      { id: "i5", quantity: 0.5, unit: "cup", name: "extra virgin olive oil" },
      { id: "i6", name: "salt and black pepper", isOptional: true },
    ],
    steps: [
      {
        id: "s1",
        instruction:
          "Toast the pine nuts in a dry pan over medium heat until golden. Cool completely.",
        durationMinutes: 3,
      },
      {
        id: "s2",
        instruction:
          "In a food processor, pulse basil, pine nuts, parmesan, and garlic until coarsely chopped.",
      },
      {
        id: "s3",
        instruction:
          "With the processor running, slowly stream in olive oil until the pesto is smooth but still has a bit of texture.",
      },
      {
        id: "s4",
        instruction:
          "Season with salt and pepper. Use immediately or freeze in ice cube trays.",
      },
    ],
  },
];

export const getFoodItemById = (id: string): FoodItem | undefined =>
  FOOD_ITEMS.find((item) => item.id === id);

/** Static for now — replace with SQLite query later. */
export const SAVED_FOOD_IDS: string[] = ["1", "3"];

export const getSavedFoodItems = (): FoodItem[] =>
  SAVED_FOOD_IDS.map((id) => FOOD_ITEMS.find((item) => item.id === id)).filter(
    (item): item is FoodItem => Boolean(item),
  );

// ─────────────────────────────────────────────────────────────
// data/food-items.ts — add at the bottom
// ─────────────────────────────────────────────────────────────

export const createEmptyFoodItem = (): FoodItem => ({
  id: "",
  title: "",
  description: "",
  imageUri: undefined,
  source: "created",
  servings: 2,
  prepTimeMinutes: 0,
  cookTimeMinutes: 0,
  ingredients: [],
  steps: [],
  photos: [],
});
