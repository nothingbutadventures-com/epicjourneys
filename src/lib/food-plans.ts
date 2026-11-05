/** The three food plans a tour can offer (admin picks one; shown on the tour page). */
export const FOOD_PLANS = [
  { id: "pure-veg", title: "Pure veg", description: "Separate veg kitchen at every hotel. Eggs on request only." },
  { id: "strict-jain", title: "Strict Jain", description: "No onion, garlic or root vegetables, confirmed with each kitchen before the trip." },
  { id: "home-comfort", title: "Home comfort", description: "Dal, roti and rice every day, plus North and South Indian breakfasts." },
] as const;

export type FoodPlanId = (typeof FOOD_PLANS)[number]["id"];
export const DEFAULT_FOOD_PLAN: FoodPlanId = "pure-veg";
export const cleanFoodPlan = (v: unknown): FoodPlanId => (FOOD_PLANS.some((p) => p.id === v) ? (v as FoodPlanId) : DEFAULT_FOOD_PLAN);
