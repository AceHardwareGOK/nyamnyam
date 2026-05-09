import { useState } from 'react';
import { ArrowLeft, Camera, ImagePlus, Plus, Save, Trash2, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import type { Recipe } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function CreateRecipeView({ onBack, initialData, onSave }: { onBack: () => void, initialData?: Recipe, onSave: (data: any) => void }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [time, setTime] = useState(initialData?.time ? initialData.time.replace(' хв', '') : '');
  const [servings, setServings] = useState(initialData?.servings || '');
  const [ingredients, setIngredients] = useState<string[]>(initialData?.ingredients?.length ? initialData.ingredients : ['']);
  const [steps, setSteps] = useState<{text: string, image?: string}[]>(initialData?.steps?.length ? initialData.steps.map((s:any) => ({text: s.text, image: s.image})) : [{ text: '' }]);
  const [mainImage, setMainImage] = useState<string>(initialData?.image || '');
  const [isUploading, setIsUploading] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorModal('Цей формат файлу не підтримується. Будь ласка, оберіть зображення (JPEG, PNG, WebP тощо).');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`${API_URL}/api/upload-image`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (!res.ok) {
        throw new Error('Невдалий запит на сервер');
      }
      
      const data = await res.json();
      setter(data.url);
    } catch (error: any) {
      console.error(error);
      setErrorModal('Сталася помилка при завантаженні фото: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const updateIngredient = (index: number, val: string) => {
    const newArr = [...ingredients];
    newArr[index] = val;
    setIngredients(newArr);
  };
  const addIngredient = () => setIngredients([...ingredients, '']);
  const removeIngredient = (index: number) => setIngredients(ingredients.filter((_, i) => i !== index));

  const updateStep = (index: number, val: string) => {
    const newArr = [...steps];
    newArr[index].text = val;
    setSteps(newArr);
  };
  
  const updateStepImage = (index: number, url: string) => {
    const newArr = [...steps];
    newArr[index].image = url;
    setSteps(newArr);
  };

  const addStep = () => setSteps([...steps, { text: '' }]);
  const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));

  const handleSubmit = () => {
    onSave({
      title,
      time_minutes: parseInt(time) || 0,
      servings: parseInt(servings as string) || 1,
      ingredients: ingredients.filter(i => i.trim()),
      steps: steps.filter(s => s.text.trim()),
      main_image_url: mainImage
    });
  };

  return (
    <div className="create-recipe-view fade-in">
      {errorModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.15)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="modal-fade-in" style={{
            background: 'var(--surface-color)',
            padding: '2rem', borderRadius: '16px',
            maxWidth: '90%', width: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-color)' }}>Помилка</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {errorModal}
            </p>
            <button className="btn-primary" style={{ width: '100%', marginTop: 0 }} onClick={() => setErrorModal(null)}>
              Зрозуміло
            </button>
          </div>
        </div>
      )}
      <button className="btn-back" onClick={onBack}>
        <ArrowLeft size={20} />
        <span>Назад</span>
      </button>
      
      <h2 className="page-title" style={{ marginBottom: '1rem' }}>{initialData ? 'Редагувати рецепт' : 'Новий рецепт'}</h2>
      
      <div className="form-group">
        <label className="form-label">Назва страви</label>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Наприклад: Пухкі сирники з ваніллю" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Час приготування (хв)</label>
          <input 
            type="number" 
            className="form-input" 
            placeholder="20" 
            value={time} 
            onChange={(e) => setTime(e.target.value)} 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Порції</label>
          <input 
            type="number" 
            className="form-input" 
            placeholder="2" 
            value={servings} 
            onChange={(e) => setServings(e.target.value)} 
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Головне фото</label>
        <label className="image-upload-box" style={{ 
          cursor: isUploading ? 'wait' : 'pointer',
          padding: mainImage ? 0 : undefined,
          overflow: 'hidden',
          height: mainImage ? 'auto' : '160px',
          position: 'relative'
        }}>
          <input type="file" accept="image/*" style={{ display: 'none' }} disabled={isUploading} onChange={(e) => handleImageUpload(e, setMainImage)} />
          {!mainImage && <Camera size={32} />}
          
          {mainImage && <img src={mainImage} alt="Головне фото" style={{ width: '100%', height: 'auto', display: 'block' }} />}
          
          <span style={mainImage ? { 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '6px', color: 'white' 
          } : {}}>
            {isUploading ? 'Завантаження...' : (mainImage ? 'Змінити фото' : 'Завантажити фото')}
          </span>
        </label>
      </div>

      <div className="form-section">
        <h3 className="section-title">Інгредієнти</h3>
        <div className="dynamic-list">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="dynamic-item">
              <span className="ingredient-dot"></span>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Напр.: Сир кисломолочний - 400 г" 
                value={ing} 
                onChange={(e) => updateIngredient(idx, e.target.value)} 
              />
              {ingredients.length > 1 && (
                <button className="btn-icon" onClick={() => removeIngredient(idx)}>
                  <X size={20} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button className="btn-add" onClick={addIngredient}>
          <Plus size={18} /> Додати інгредієнт
        </button>
      </div>

      <div className="form-section">
        <h3 className="section-title">Покроковий рецепт</h3>
        <div className="dynamic-list steps-form-list">
          {steps.map((step, idx) => (
            <div key={idx} className="form-step-card">
              <div className="step-header">
                <div className="step-number">{idx + 1}</div>
                {steps.length > 1 && (
                  <button className="btn-icon danger" onClick={() => removeStep(idx)}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <textarea 
                className="form-textarea" 
                placeholder="Опишіть цей крок..." 
                value={step.text} 
                onChange={(e) => updateStep(idx, e.target.value)} 
              />
              <label className="image-upload-box small" style={{ 
                cursor: isUploading ? 'wait' : 'pointer',
                padding: step.image ? 0 : undefined,
                overflow: 'hidden',
                height: step.image ? 'auto' : '100px',
                position: 'relative'
              }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} disabled={isUploading} onChange={(e) => handleImageUpload(e, (url) => updateStepImage(idx, url))} />
                {!step.image && <ImagePlus size={24} />}
                
                {step.image && <img src={step.image} alt={`Крок ${idx + 1}`} style={{ width: '100%', height: 'auto', display: 'block' }} />}
                
                <span style={step.image ? { 
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '0.8rem', textAlign: 'center' 
                } : {}}>
                  {step.image ? 'Змінити фото' : "Фото кроку (необов'язково)"}
                </span>
              </label>
            </div>
          ))}
        </div>
        <button className="btn-add" onClick={addStep}>
          <Plus size={18} /> Додати крок
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button className="btn-secondary" style={{ flex: 1, padding: '1rem', fontSize: '1.1rem', borderRadius: '12px' }} onClick={onBack} disabled={isUploading}>
          Скасувати
        </button>
        <button className="btn-primary btn-save" style={{ flex: 1, marginTop: 0 }} onClick={handleSubmit} disabled={isUploading}>
          <Save size={20} />
          {initialData ? 'Оновити' : 'Зберегти'}
        </button>
      </div>
    </div>
  );
}
