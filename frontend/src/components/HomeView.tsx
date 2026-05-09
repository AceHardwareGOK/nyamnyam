import { Link as LinkIcon, ArrowRight, Plus, Clock } from 'lucide-react';

import type { Recipe } from '../types';
import { GenerationProgressView } from './GenerationProgressView';

interface HomeViewProps {
  url: string;
  setUrl: (url: string) => void;
  isLoading: boolean;
  statusMessage?: string;
  handleSubmit: (e: React.FormEvent) => void;
  handleTabChange: (tab: string) => void;
  recipesList: Recipe[];
  isFetchingRecipes?: boolean;
}

export function HomeView({ url, setUrl, isLoading, statusMessage, handleSubmit, handleTabChange, recipesList, isFetchingRecipes }: HomeViewProps) {
  return (
    <div className="home-view fade-in">
      <div className="hero">
        <h1 className="hero-title">Збережіть рецепт<br/>з будь-якого відео.</h1>
        <p className="hero-subtitle">
          Вставте посилання з TikTok, Instagram або YouTube, і ми перетворимо відео на зручний покроковий рецепт із фотографіями.
        </p>

        <form className="url-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <LinkIcon size={20} className="input-icon" />
            <input 
              type="url" 
              placeholder="Вставте посилання на відео..." 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={isLoading}
            />
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Обробка...' : <ArrowRight size={20} />}
            </button>
          </div>

          {/* Remove inline progress container, we will show GenerationProgressView below */}
        </form>

        {!isLoading && (
          <>
            <div className="hero-divider">
              <span>Або</span>
            </div>

            <button className="btn-secondary btn-large" onClick={() => handleTabChange('create')}>
              <Plus size={20} />
              <span>Створити свій власний рецепт</span>
            </button>
          </>
        )}
      </div>

      {isLoading && <GenerationProgressView statusMessage={statusMessage} />}

      {(!isLoading && (isFetchingRecipes || recipesList.length > 0)) && (
        <section className="recent-recipes">
          <h3 className="section-title">Останні збережені</h3>
          {isFetchingRecipes ? (
            <div className="recipes-grid">
              {[1, 2].map(i => (
                <div key={i} className="recipe-card skeleton-card">
                  <div className="recipe-image skeleton"></div>
                  <div className="recipe-info">
                    <div className="skeleton skeleton-text"></div>
                    <div className="skeleton skeleton-text short"></div>
                  </div>
                </div>
              ))}
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
        </section>
      )}
    </div>
  );
}
