import { useState, useEffect } from 'react';
import { ChefHat, Link as LinkIcon, ArrowRight, Clock, BookOpen, Home, ArrowLeft, ExternalLink, Users, Settings, Moon, Sun, Monitor, Trash2, LogOut, LogIn, Plus, X, Camera, Save, ImagePlus, Share2, Edit2 } from 'lucide-react';
import './index.css';
import './App.css';
import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Unused mock variables removed

function CreateRecipeView({ onBack, initialData, onSave }: { onBack: () => void, initialData?: any, onSave: (data: any) => void }) {
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

function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'recipes' | 'settings' | 'create'
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('nyamnyam-theme') as any) || 'system';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [session, setSession] = useState<any | null>(null);
  const [recipesList, setRecipesList] = useState<any[]>([]);

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, type: 'alert' | 'confirm', onConfirm?: () => void, onCancel?: () => void}>({ isOpen: false, title: '', message: '', type: 'alert' });

  const showAlert = (title: string, message: string) => {
    setModalConfig({ isOpen: true, title, message, type: 'alert' });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setModalConfig({ isOpen: true, title, message, type: 'confirm', onConfirm, onCancel });
  };

  const closeModal = () => {
    if (modalConfig.type === 'confirm' && modalConfig.onCancel) {
      modalConfig.onCancel();
    }
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoggedIn(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) console.error('Error logging in:', error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  useEffect(() => {
    if (activeTab === 'recipes' || activeTab === 'home') {
      fetch(`${API_URL}/api/recipes`, {
        headers: getHeaders()
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setRecipesList(data.data.map((r: any) => {
              let mainImage = r.main_image_url;
              if (!mainImage && r.recipe_steps && r.recipe_steps.length > 0) {
                const stepsWithImage = r.recipe_steps.filter((s: any) => s.image_url);
                if (stepsWithImage.length > 0) mainImage = stepsWithImage[stepsWithImage.length - 1].image_url;
              }
              if (!mainImage) mainImage = "https://images.unsplash.com/photo-1574783756547-258b3c720fe9?auto=format&fit=crop&q=80&w=400";
              return {
                id: r.id,
                title: r.title,
                time: `${r.time_minutes} хв`,
                image: mainImage
              };
            }));
          }
        })
        .catch(err => console.error("Failed to fetch recipes:", err));
    }
  }, [activeTab, session]);

  // Hash-routing to support browser Back/Forward buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      
      if (hash === 'recipes') {
        setActiveTab('recipes');
        setSelectedRecipe(null);
      } else if (hash === 'settings') {
        setActiveTab('settings');
        setSelectedRecipe(null);
      } else if (hash === 'create') {
        setActiveTab('create');
        setSelectedRecipe(null);
      } else if (hash.startsWith('recipe-')) {
        const id = hash.replace('recipe-', '');
        setActiveTab(prev => (prev === 'edit' || prev === 'create') ? 'home' : prev);
        if (!selectedRecipe || selectedRecipe.id !== id) {
          fetchRecipeDetails(id);
        }
      } else if (hash.startsWith('edit-')) {
        const id = hash.replace('edit-', '');
        setActiveTab('edit');
        if (!selectedRecipe || selectedRecipe.id !== id) {
          fetchRecipeDetails(id);
        }
      } else {
        setActiveTab('home');
        setSelectedRecipe(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initialize state from hash on first load
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [session, selectedRecipe]);

  const fetchRecipeDetails = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/recipes/${id}`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error("Failed to fetch recipe");
      const result = await response.json();
      const dbRecipe = result.data;
      
      let mainImage = dbRecipe.main_image_url;
      if (!mainImage && dbRecipe.steps && dbRecipe.steps.length > 0) {
        const stepsWithImage = dbRecipe.steps.filter((s: any) => s.image_url);
        if (stepsWithImage.length > 0) mainImage = stepsWithImage[stepsWithImage.length - 1].image_url;
      }
      if (!mainImage) mainImage = "https://images.unsplash.com/photo-1574783756547-258b3c720fe9?auto=format&fit=crop&q=80&w=800";

      const detailedRecipe = {
        id: dbRecipe.id,
        title: dbRecipe.title,
        time: `${dbRecipe.time_minutes} хв`,
        servings: dbRecipe.servings,
        originalUrl: dbRecipe.source_url,
        image: mainImage,
        ingredients: dbRecipe.ingredients.map((ing: any) => ing.name),
        steps: dbRecipe.steps.map((step: any) => ({
          stepNumber: step.step_number,
          text: step.instruction,
          image: step.image_url || ""
        }))
      };
      setSelectedRecipe(detailedRecipe);
    } catch (error) {
      console.error(error);
      showAlert('Помилка', "Не вдалося завантажити деталі рецепту.");
    }
  };

  useEffect(() => {
    localStorage.setItem('nyamnyam-theme', theme);
    const root = document.documentElement;
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/api/extract`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ url })
      });
      
      if (!response.ok) {
        throw new Error('Помилка генерації рецепту');
      }
      
      const result = await response.json();
      
      // Transform API response
      setUrl('');
      window.location.hash = `recipe-${result.db_info.id}`;
    } catch (error) {
      console.error(error);
      showAlert('Помилка', 'Не вдалося згенерувати рецепт. Перевірте посилання або спробуйте пізніше.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    window.location.hash = tab === 'home' ? '' : tab;
  };

  const handleDelete = async (id: string) => {
    showConfirm('Підтвердження видалення', 'Ви дійсно хочете видалити цей рецепт?', async () => {
      try {
        const res = await fetch(`${API_URL}/api/recipes/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        if (res.ok) {
          setRecipesList(prev => prev.filter(r => r.id !== id));
          setSelectedRecipe(null);
        } else {
          showAlert('Помилка', 'Неможливо видалити рецепт.');
        }
      } catch (err) {
        console.error(err);
        showAlert('Помилка', 'Помилка з\'єднання з сервером.');
      }
    });
  };

  const handleDeleteAll = async () => {
    showConfirm('Видалення всіх рецептів', 'Ви дійсно хочете видалити всі свої рецепти? Цю дію неможливо скасувати.', async () => {
      try {
        const res = await fetch(`${API_URL}/api/recipes`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        if (res.ok) {
          setRecipesList([]);
          showAlert('Успіх', 'Всі ваші рецепти успішно видалено.');
        } else {
          showAlert('Помилка', 'Неможливо видалити рецепти.');
        }
      } catch (err) {
        console.error(err);
        showAlert('Помилка', 'Помилка з\'єднання з сервером.');
      }
    });
  };

  const handleShare = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/recipes/${id}/share`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        showAlert('Успіх', 'Тепер цей рецепт публічний! Ви можете скопіювати посилання.');
      } else {
        showAlert('Помилка', 'Не вдалося зробити рецепт публічним.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSave = async (data: any) => {
    if (!selectedRecipe) return;
    try {
      const res = await fetch(`${API_URL}/api/recipes/${selectedRecipe.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) {
        showAlert('Успіх', 'Рецепт успішно оновлено!');
        // Re-fetch the updated recipe details to show the new data
        await fetchRecipeDetails(selectedRecipe.id);
        setActiveTab('recipes'); // This doesn't matter much as selectedRecipe is truthy, but good for state
      } else {
        showAlert('Помилка', 'Неможливо оновити рецепт.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {modalConfig.isOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.15)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="modal-fade-in" style={{
            background: 'var(--surface-color)',
            padding: '2rem', borderRadius: '16px',
            maxWidth: '90%', width: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-color)' }}>{modalConfig.title}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {modalConfig.message}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {modalConfig.type === 'confirm' && (
                <button className="btn-secondary" style={{ flex: 1, marginTop: 0 }} onClick={closeModal}>
                  Скасувати
                </button>
              )}
              <button className="btn-primary" style={{ flex: 1, marginTop: 0 }} onClick={() => {
                if (modalConfig.type === 'confirm' && modalConfig.onConfirm) {
                  modalConfig.onConfirm();
                }
                setModalConfig(prev => ({ ...prev, isOpen: false }));
              }}>
                {modalConfig.type === 'confirm' ? 'Підтвердити' : 'Зрозуміло'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="app-wrapper fade-in">
        <header className="header">
        <div className="logo" onClick={() => handleTabChange('home')} style={{cursor: 'pointer'}}>
          <ChefHat size={32} color="var(--accent-color)" />
          <span>НямНям.</span>
        </div>
        <div className="header-actions">
          {!isLoggedIn ? (
            <button className="btn-secondary" onClick={loginWithGoogle}>Увійти через Google</button>
          ) : (
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Вітаємо, {session?.user?.user_metadata?.full_name?.split(' ')[0] || session?.user?.user_metadata?.name?.split(' ')[0] || 'кулінаре'}!
            </span>
          )}
        </div>
      </header>

      <main className="main-content container">
        {selectedRecipe && activeTab !== 'edit' ? (
          <div className="recipe-detail-view fade-in">
            <button className="btn-back" onClick={() => { window.location.hash = activeTab === 'recipes' ? 'recipes' : ''; }}>
              <ArrowLeft size={20} />
              <span>Назад</span>
            </button>
            
            <div className="detail-header">
              <h1 className="detail-title">{selectedRecipe.title}</h1>
              <div className="detail-meta">
                <span className="meta-item"><Clock size={16} /> {selectedRecipe.time}</span>
                <span className="meta-item"><Users size={16} /> {selectedRecipe.servings} порції</span>
              </div>
              {selectedRecipe.originalUrl && (
                <a href={selectedRecipe.originalUrl} target="_blank" rel="noreferrer" className="original-link-btn">
                  <ExternalLink size={18} />
                  <span>Оригінальне відео</span>
                </a>
              )}
            </div>

            <div className="detail-hero-image" style={{ backgroundImage: `url(${selectedRecipe.image})` }}></div>

            <div className="detail-content">
              <div className="ingredients-section">
                <h3 className="section-title">Інгредієнти</h3>
                <ul className="ingredients-list">
                  {selectedRecipe.ingredients.map((ing: string, idx: number) => (
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
                  {selectedRecipe.steps.map((step: any) => (
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
                <button className="settings-action-btn" onClick={() => { window.location.hash = `edit-${selectedRecipe.id}`; }}>
                  <Edit2 size={20} />
                  <span>Редагувати</span>
                </button>
                <button className="settings-action-btn" onClick={() => handleShare(selectedRecipe.id)}>
                  <Share2 size={20} />
                  <span>Поділитись</span>
                </button>
                <button className="settings-action-btn danger" onClick={() => handleDelete(selectedRecipe.id)}>
                  <Trash2 size={20} />
                  <span>Видалити</span>
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'home' ? (
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

                {isLoading && (
                  <div className="progress-container fade-in">
                    <div className="progress-bar">
                      <div className="progress-bar-fill"></div>
                    </div>
                    <div className="progress-text">
                      ШІ аналізує відео та створює покроковий рецепт... Це може зайняти до хвилини.
                    </div>
                  </div>
                )}
              </form>

              <div className="hero-divider">
                <span>Або</span>
              </div>

              <button className="btn-secondary btn-large" onClick={() => handleTabChange('create')}>
                <Plus size={20} />
                <span>Створити свій власний рецепт</span>
              </button>
            </div>

            {recipesList.length > 0 && (
              <section className="recent-recipes">
                <h3 className="section-title">Останні збережені</h3>
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
              </section>
            )}
          </div>
        ) : activeTab === 'settings' ? (
          <div className="settings-view fade-in">
            <h2 className="page-title">Налаштування</h2>
            
            <div className="settings-section">
              <h3 className="section-title">Вигляд</h3>
              <div className="theme-toggle">
                <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
                  <Sun size={20} />
                  <span>Світла</span>
                </button>
                <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                  <Moon size={20} />
                  <span>Темна</span>
                </button>
                <button className={`theme-btn ${theme === 'system' ? 'active' : ''}`} onClick={() => setTheme('system')}>
                  <Monitor size={20} />
                  <span>Авто</span>
                </button>
              </div>
            </div>

            <div className="settings-section">
              <h3 className="section-title">Акаунт</h3>
              {isLoggedIn ? (
                <button className="settings-action-btn" onClick={handleLogout}>
                  <LogOut size={20} />
                  <span>Вийти з акаунта</span>
                </button>
              ) : (
                <button className="settings-action-btn" onClick={loginWithGoogle}>
                  <LogIn size={20} />
                  <span>Увійти через Google</span>
                </button>
              )}
            </div>

            <div className="settings-section">
              <h3 className="section-title">Дані</h3>
              <button className="settings-action-btn danger" onClick={handleDeleteAll}>
                <Trash2 size={20} />
                <span>Видалити всі рецепти</span>
              </button>
            </div>
          </div>
        ) : activeTab === 'create' ? (
          <CreateRecipeView onBack={() => { window.location.hash = ''; }} onSave={() => showAlert('Інфо', 'Створення в розробці...')} />
        ) : activeTab === 'edit' && selectedRecipe ? (
          <CreateRecipeView initialData={selectedRecipe} onBack={() => { window.location.hash = `recipe-${selectedRecipe.id}`; }} onSave={handleEditSave} />
        ) : (
          <div className="recipes-view fade-in">
            <h2 className="page-title">Мої рецепти</h2>
            {recipesList.length === 0 ? (
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
        )}
        </main>
      </div>

      <nav className="bottom-nav fade-in-nav">
        <button 
          className={`bottom-nav-link ${activeTab === 'home' && !selectedRecipe ? 'active' : ''}`}
          onClick={() => handleTabChange('home')}
        >
          <Home size={20} />
          <span>Головна</span>
        </button>
        <button 
          className={`bottom-nav-link ${activeTab === 'recipes' && !selectedRecipe ? 'active' : ''}`}
          onClick={() => handleTabChange('recipes')}
        >
          <BookOpen size={20} />
          <span>Рецепти</span>
        </button>
        <button 
          className={`bottom-nav-link ${activeTab === 'settings' && !selectedRecipe ? 'active' : ''}`}
          onClick={() => handleTabChange('settings')}
        >
          <Settings size={20} />
          <span>Налаштування</span>
        </button>
      </nav>
    </>
  );
}

export default App;

