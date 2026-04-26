import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="inline-flex rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`px-3 py-1.5 text-xs font-bold transition-colors ${theme === 'dark' ? 'bg-primary text-white' : 'bg-background text-slate-300 hover:text-white hover:bg-surface-lighter'}`}
      >
        {t('settings.themeDark')}
      </button>
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`px-3 py-1.5 text-xs font-bold transition-colors ${theme === 'light' ? 'bg-primary text-white' : 'bg-background text-slate-300 hover:text-white hover:bg-surface-lighter'}`}
      >
        {t('settings.themeLight')}
      </button>
    </div>
  );
};

export default ThemeSwitcher;
