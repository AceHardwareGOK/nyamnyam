export interface RecipeStep {
  stepNumber: number;
  text: string;
  image?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  image: string;
  time: string;
  servings: number;
  originalUrl?: string;
  ingredients: string[];
  steps: RecipeStep[];
  isPublic?: boolean;
  calories_100g?: number;
  protein_100g?: number;
  fat_100g?: number;
  carbs_100g?: number;
  calories_serving?: number;
  protein_serving?: number;
  fat_serving?: number;
  carbs_serving?: number;
}
