import { Sun, Moon, Monitor, LogOut, LogIn, Trash2 } from 'lucide-react';

interface SettingsViewProps {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  isLoggedIn: boolean;
  handleLogout: () => void;
  loginWithGoogle: () => void;
  handleDeleteAll: () => void;
}

export function SettingsView({ theme, setTheme, isLoggedIn, handleLogout, loginWithGoogle, handleDeleteAll }: SettingsViewProps) {
  return (
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
  );
}
