import { ChefHat, Clock } from 'lucide-react';

import type { Recipe } from '../types';

interface RecipesViewProps {
  recipesList: Recipe[];
  isFetchingRecipes?: boolean;
}

export function RecipesView({ recipesList, isFetchingRecipes }: RecipesViewProps) {
  return (
    <div className="recipes-view fade-in">
      <h2 className="page-title">Мої рецепти</h2>
      {isFetchingRecipes ? (
        <div className="recipes-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="recipe-card skeleton-card">
              <div className="recipe-image skeleton"></div>
              <div className="recipe-info">
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text short"></div>
              </div>
            </div>
          ))}
        </div>
      ) : recipesList.length === 0 ? (
        <div className="empty-state">
          <ChefHat size={48} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3>Додайте ваш перший рецепт</h3>
          <p>Всі збережені відео-рецепти з'являться тут.</p>
        </div>
      ) : (
        <div className="recipes-grid">
            {recipesList.map(recipe => (
              <div key={recipe.id} className="recipe-card" onClick={() => { window.location.hash = `recipe-${recipe.id}`; }}>
                <div className="recipe-image" style={{ backgroundImage: `url(${recipe.image})` }}></div>
                <div className="recipe-info">
                  <h4>{recipe.title}</h4>
                  <span className="recipe-time"><Clock size={14} /> {recipe.time}</span>
                </div>
              </div>
            ))}
          </div>
      )}
    </div>
  );
}
