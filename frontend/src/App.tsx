import { useState, useEffect } from 'react';
import { ChefHat, Link as LinkIcon, ArrowRight, Clock, BookOpen, Home, ArrowLeft, ExternalLink, Users, Settings, Moon, Sun, Monitor, Trash2, LogOut, LogIn, Plus, X, Camera, Save, ImagePlus } from 'lucide-react';
import './index.css';
import './App.css';

// Mock data for recent recipes
const RECENT_RECIPES = [
  {
    id: 1,
    title: "Пухкі сирники з ваніллю",
    time: "20 хв",
    image: "https://images.unsplash.com/photo-1574783756547-258b3c720fe9?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 2,
    title: "Паста Карбонара за 15 хвилин",
    time: "15 хв",
    image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&q=80&w=400"
  }
];

const MOCK_RECIPE_DETAIL = {
  id: 1,
  title: "Пухкі сирники з ваніллю",
  time: "20 хв",
  servings: 2,
  originalUrl: "https://tiktok.com/@user/video/123",
  image: "https://images.unsplash.com/photo-1574783756547-258b3c720fe9?auto=format&fit=crop&q=80&w=800",
  ingredients: [
    "Сир кисломолочний (9%) - 400 г",
    "Яйце - 1 шт",
    "Цукор - 2 ст. л.",
    "Ванільний цукор - 1 ч. л.",
    "Борошно - 2 ст. л.",
    "Олія для смаження"
  ],
  steps: [
    {
      stepNumber: 1,
      text: "Перетріть сир через сито або збийте блендером для однорідної маси без грудочок.",
      image: "https://images.unsplash.com/photo-1621304523996-3c589b27b3fa?auto=format&fit=crop&q=80&w=400"
    },
    {
      stepNumber: 2,
      text: "Додайте яйце, звичайний та ванільний цукор. Добре перемішайте.",
      image: "https://images.unsplash.com/photo-1588675402636-6e7921820b32?auto=format&fit=crop&q=80&w=400"
    },
    {
      stepNumber: 3,
      text: "Додайте борошно і замісіть тісто. Сформуйте сирники, обвалюючи їх у борошні.",
      image: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?auto=format&fit=crop&q=80&w=400"
    },
    {
      stepNumber: 4,
      text: "Смажте на розігрітій сковороді з невеликою кількістю олії до золотистої скоринки з обох сторін.",
      image: "https://images.unsplash.com/photo-1574783756547-258b3c720fe9?auto=format&fit=crop&q=80&w=400"
    }
  ]
};

function CreateRecipeView({ onBack }: { onBack: () => void }) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [steps, setSteps] = useState([{ text: '' }]);

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
  const addStep = () => setSteps([...steps, { text: '' }]);
  const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));

  return (
    <div className="create-recipe-view fade-in">
      <button className="btn-back" onClick={onBack}>
        <ArrowLeft size={20} />
        <span>Назад</span>
      </button>
      
      <h2 className="page-title" style={{ marginBottom: '1rem' }}>Новий рецепт</h2>
      
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
          <label className="form-label">Час приготування</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="20 хв" 
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
        <div className="image-upload-box">
          <Camera size={32} />
          <span>Завантажити фото</span>
        </div>
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
              <div className="image-upload-box small">
                <ImagePlus size={24} />
                <span>Фото кроку (необов'язково)</span>
              </div>
            </div>
          ))}
        </div>
        <button className="btn-add" onClick={addStep}>
          <Plus size={18} /> Додати крок
        </button>
      </div>

      <button className="btn-primary btn-save">
        <Save size={20} />
        Зберегти рецепт
      </button>
    </div>
  );
}

function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'recipes' | 'settings' | 'create'
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setIsLoading(true);
    // Placeholder for actual API call
    setTimeout(() => {
      setIsLoading(false);
      setSelectedRecipe(1); // Auto open the mock recipe detail
      setUrl('');
    }, 1500);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedRecipe(null);
  };

  return (
    <>
      <div className="app-wrapper fade-in">
        <header className="header">
        <div className="logo" onClick={() => handleTabChange('home')} style={{cursor: 'pointer'}}>
          <ChefHat size={32} color="var(--accent-color)" />
          <span>НямНям.</span>
        </div>
        <div className="header-actions">
          {!isLoggedIn && (
            <button className="btn-secondary" onClick={() => setIsLoggedIn(true)}>Увійти</button>
          )}
        </div>
      </header>

      <main className="main-content container">
        {selectedRecipe ? (
          <div className="recipe-detail-view fade-in">
            <button className="btn-back" onClick={() => setSelectedRecipe(null)}>
              <ArrowLeft size={20} />
              <span>Назад</span>
            </button>
            
            <div className="detail-header">
              <h1 className="detail-title">{MOCK_RECIPE_DETAIL.title}</h1>
              <div className="detail-meta">
                <span className="meta-item"><Clock size={16} /> {MOCK_RECIPE_DETAIL.time}</span>
                <span className="meta-item"><Users size={16} /> {MOCK_RECIPE_DETAIL.servings} порції</span>
              </div>
              <a href={MOCK_RECIPE_DETAIL.originalUrl} target="_blank" rel="noreferrer" className="original-link-btn">
                <ExternalLink size={18} />
                <span>Оригінальне відео</span>
              </a>
            </div>

            <div className="detail-hero-image" style={{ backgroundImage: `url(${MOCK_RECIPE_DETAIL.image})` }}></div>

            <div className="detail-content">
              <div className="ingredients-section">
                <h3 className="section-title">Інгредієнти</h3>
                <ul className="ingredients-list">
                  {MOCK_RECIPE_DETAIL.ingredients.map((ing, idx) => (
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
                  {MOCK_RECIPE_DETAIL.steps.map(step => (
                    <div key={step.stepNumber} className="instruction-step">
                      <div className="step-number">{step.stepNumber}</div>
                      <div className="step-content">
                        <p className="step-text">{step.text}</p>
                        <div className="step-image" style={{ backgroundImage: `url(${step.image})` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
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
                  />
                  <button type="submit" className="btn-primary" disabled={isLoading}>
                    {isLoading ? 'Аналізуємо...' : <ArrowRight size={20} />}
                  </button>
                </div>
              </form>

              <div className="hero-divider">
                <span>Або</span>
              </div>

              <button className="btn-secondary btn-large" onClick={() => handleTabChange('create')}>
                <Plus size={20} />
                <span>Створити свій власний рецепт</span>
              </button>
            </div>

            <section className="recent-recipes">
              <h3 className="section-title">Останні збережені</h3>
              <div className="recipes-grid">
                {RECENT_RECIPES.map(recipe => (
                  <div key={recipe.id} className="recipe-card" onClick={() => setSelectedRecipe(recipe.id)}>
                    <div className="recipe-image" style={{ backgroundImage: `url(${recipe.image})` }}></div>
                    <div className="recipe-info">
                      <h4>{recipe.title}</h4>
                      <span className="recipe-time"><Clock size={14} /> {recipe.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
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
                <button className="settings-action-btn" onClick={() => setIsLoggedIn(false)}>
                  <LogOut size={20} />
                  <span>Вийти з акаунта</span>
                </button>
              ) : (
                <button className="settings-action-btn" onClick={() => setIsLoggedIn(true)}>
                  <LogIn size={20} />
                  <span>Увійти</span>
                </button>
              )}
            </div>

            <div className="settings-section">
              <h3 className="section-title">Дані</h3>
              <button className="settings-action-btn danger">
                <Trash2 size={20} />
                <span>Видалити всі рецепти</span>
              </button>
            </div>
          </div>
        ) : activeTab === 'create' ? (
          <CreateRecipeView onBack={() => handleTabChange('home')} />
        ) : (
          <div className="recipes-view fade-in">
            <h2 className="page-title">Мої рецепти</h2>
            <div className="recipes-grid">
                {RECENT_RECIPES.map(recipe => (
                  <div key={recipe.id} className="recipe-card" onClick={() => setSelectedRecipe(recipe.id)}>
                    <div className="recipe-image" style={{ backgroundImage: `url(${recipe.image})` }}></div>
                    <div className="recipe-info">
                      <h4>{recipe.title}</h4>
                      <span className="recipe-time"><Clock size={14} /> {recipe.time}</span>
                    </div>
                  </div>
                ))}
              </div>
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
