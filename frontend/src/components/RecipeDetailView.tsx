import { useState } from 'react';
import { Clock, Users, ExternalLink, Edit2, Share2, Trash2, ArrowLeft } from 'lucide-react';
import type { Recipe } from '../types';

interface RecipeDetailViewProps {
  recipe: Recipe;
  onBack: () => void;
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
}

export function RecipeDetailView({ recipe, onBack, onEdit, onShare, onDelete }: RecipeDetailViewProps) {
  const [nutritionTab, setNutritionTab] = useState<'100g' | 'serving'>('100g');

  return (
    <div className="recipe-detail-view fade-in">
      <button className="btn-back" onClick={onBack}>
        <ArrowLeft size={20} />
        <span>Назад</span>
      </button>
      
      <div className="detail-header">
        <h1 className="detail-title">{recipe.title}</h1>
        <div className="detail-meta">
          <span className="meta-item"><Clock size={16} /> {recipe.time}</span>
          <span className="meta-item"><Users size={16} /> {recipe.servings} порції</span>
        </div>
        {recipe.originalUrl && (
          <a href={recipe.originalUrl} target="_blank" rel="noreferrer" className="original-link-btn">
            <ExternalLink size={18} />
            <span>Оригінальне відео</span>
          </a>
        )}
      </div>

      <div className="detail-hero-image" style={{ backgroundImage: `url(${recipe.image})` }}></div>

      <div className="detail-content">
        {(recipe.calories_100g !== undefined) && (
          <div className="nutrition-section">
            <div className="nutrition-header">
              <h3 className="section-title">Харчова цінність</h3>
              <div className="nutrition-tabs">
                <button 
                  className={`nutrition-tab ${nutritionTab === '100g' ? 'active' : ''}`}
                  onClick={() => setNutritionTab('100g')}
                >
                  На 100 г
                </button>
                <button 
                  className={`nutrition-tab ${nutritionTab === 'serving' ? 'active' : ''}`}
                  onClick={() => setNutritionTab('serving')}
                >
                  На порцію
                </button>
              </div>
            </div>
            
            <div className="nutrition-grid">
              <div className="nutrition-item">
                <span className="nutrition-value">
                  {nutritionTab === '100g' ? (recipe.calories_100g || 0) : (recipe.calories_serving || 0)}
                </span>
                <span className="nutrition-label">ккал</span>
              </div>
              <div className="nutrition-item">
                <span className="nutrition-value">
                  {nutritionTab === '100g' ? (recipe.protein_100g || 0) : (recipe.protein_serving || 0)}
                </span>
                <span className="nutrition-label">Білки, г</span>
              </div>
              <div className="nutrition-item">
                <span className="nutrition-value">
                  {nutritionTab === '100g' ? (recipe.fat_100g || 0) : (recipe.fat_serving || 0)}
                </span>
                <span className="nutrition-label">Жири, г</span>
              </div>
              <div className="nutrition-item">
                <span className="nutrition-value">
                  {nutritionTab === '100g' ? (recipe.carbs_100g || 0) : (recipe.carbs_serving || 0)}
                </span>
                <span className="nutrition-label">Вуглеводи, г</span>
              </div>
            </div>
          </div>
        )}
        <div className="ingredients-section">
          <h3 className="section-title">Інгредієнти</h3>
          <ul className="ingredients-list">
            {recipe.ingredients.map((ing: string, idx: number) => (
              <li key={idx} className="ingredient-item">
                <span className="ingredient-dot"></span>
                {ing}
              </li>
            ))}
          </ul>
        </div>

        <div className="instructions-section">
          <h3 className="section-title">Покроковий рецепт</h3>
          <div className="steps-list">
            {recipe.steps.map((step: any) => (
              <div key={step.stepNumber} className="instruction-step">
                <div className="step-number">{step.stepNumber}</div>
                <div className="step-content">
                  <p className="step-text">{step.text}</p>
                  {step.image && (
                    <img src={step.image} alt={`Крок ${step.stepNumber}`} className="step-image" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="recipe-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <button className="settings-action-btn" onClick={onEdit}>
            <Edit2 size={20} />
            <span>Редагувати</span>
          </button>
          <button className="settings-action-btn" onClick={onShare}>
            <Share2 size={20} />
            <span>Поділитись</span>
          </button>
          <button className="settings-action-btn danger" onClick={onDelete}>
            <Trash2 size={20} />
            <span>Видалити</span>
          </button>
        </div>
      </div>
    </div>
  );
}
