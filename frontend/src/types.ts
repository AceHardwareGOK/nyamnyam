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
}
