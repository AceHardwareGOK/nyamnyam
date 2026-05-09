import { useState, useEffect } from 'react';
import { ChefHat, BookOpen, Home, Settings } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import './index.css';
import './App.css';
import { supabase } from './supabaseClient';
import { CreateRecipeView } from './components/CreateRecipeView';
import { HomeView } from './components/HomeView';
import { RecipeDetailView } from './components/RecipeDetailView';
import { SettingsView } from './components/SettingsView';
import { RecipesView } from './components/RecipesView';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Unused mock variables removed



import type { Recipe } from './types';

function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'recipes' | 'settings' | 'create'
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('nyamnyam-theme') as any) || 'system';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [session, setSession] = useState<any | null>(null);
  const [recipesList, setRecipesList] = useState<Recipe[]>([]);
  const [isFetchingRecipes, setIsFetchingRecipes] = useState(false);

  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, type: 'alert' | 'confirm', onConfirm?: () => void, onCancel?: () => void}>({ isOpen: false, title: '', message: '', type: 'alert' });

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
      setIsFetchingRecipes(true);
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
        .catch(err => console.error("Failed to fetch recipes:", err))
        .finally(() => setIsFetchingRecipes(false));
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
      toast.error("Не вдалося завантажити деталі рецепту.");
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
    setStatusMessage('Ініціалізація завдання...');
    
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
      const jobId = result.job_id;
      
      if (!jobId) {
         throw new Error('No job_id returned');
      }

      // Start polling
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_URL}/api/extract/status/${jobId}`, {
            headers: getHeaders()
          });
          if (!statusRes.ok) throw new Error('Помилка опитування статусу');
          
          const statusData = await statusRes.json();
          
          if (statusData.message) {
            setStatusMessage(statusData.message);
          }

          if (statusData.status === 'success') {
            clearInterval(pollInterval);
            setUrl('');
            setStatusMessage('');
            setIsLoading(false);
            window.location.hash = `recipe-${statusData.db_info.id}`;
          } else if (statusData.status === 'error') {
            clearInterval(pollInterval);
            setIsLoading(false);
            setStatusMessage('');
            toast.error(statusData.error || 'Не вдалося згенерувати рецепт.');
          }
          
        } catch (pollErr) {
          console.error(pollErr);
          clearInterval(pollInterval);
          setIsLoading(false);
          setStatusMessage('');
          toast.error("Втрачено зв'язок із сервером.");
        }
      }, 2000);

    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setStatusMessage('');
      toast.error('Не вдалося ініціалізувати завдання. Перевірте посилання або спробуйте пізніше.');
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
          toast.error('Неможливо видалити рецепт.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Помилка з\'єднання з сервером.');
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
          toast.success('Всі ваші рецепти успішно видалено.');
        } else {
          toast.error('Неможливо видалити рецепти.');
        }
      } catch (err) {
        console.error(err);
        toast.error('Помилка з\'єднання з сервером.');
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
        toast.success('Тепер цей рецепт публічний! Ви можете скопіювати посилання.');
      } else {
        toast.error('Не вдалося зробити рецепт публічним.');
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
        toast.success('Рецепт успішно оновлено!');
        // Re-fetch the updated recipe details to show the new data
        await fetchRecipeDetails(selectedRecipe.id);
        setActiveTab('recipes'); // This doesn't matter much as selectedRecipe is truthy, but good for state
      } else {
        toast.error('Неможливо оновити рецепт.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
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
          <RecipeDetailView 
            recipe={selectedRecipe} 
            onBack={() => { window.location.hash = activeTab === 'recipes' ? 'recipes' : ''; }} 
            onEdit={() => { window.location.hash = `edit-${selectedRecipe.id}`; }}
            onShare={() => handleShare(selectedRecipe.id)}
            onDelete={() => handleDelete(selectedRecipe.id)}
          />
        ) : activeTab === 'home' ? (
<HomeView url={url} setUrl={setUrl} isLoading={isLoading} statusMessage={statusMessage} handleSubmit={handleSubmit} handleTabChange={handleTabChange} recipesList={recipesList} isFetchingRecipes={isFetchingRecipes} />
        ) : activeTab === 'settings' ? (
<SettingsView 
            theme={theme} 
            setTheme={setTheme} 
            isLoggedIn={isLoggedIn} 
            handleLogout={handleLogout} 
            loginWithGoogle={loginWithGoogle} 
            handleDeleteAll={handleDeleteAll} 
          />
        ) : activeTab === 'create' ? (
          <CreateRecipeView onBack={() => { window.location.hash = ''; }} onSave={() => toast('Створення в розробці...')} />
        ) : activeTab === 'edit' && selectedRecipe ? (
          <CreateRecipeView initialData={selectedRecipe} onBack={() => { window.location.hash = `recipe-${selectedRecipe.id}`; }} onSave={handleEditSave} />
        ) : (
<RecipesView recipesList={recipesList} isFetchingRecipes={isFetchingRecipes} />
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

