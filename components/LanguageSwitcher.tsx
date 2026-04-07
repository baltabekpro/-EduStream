import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface LanguageSwitcherProps {
    className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
    const { language, setLanguage } = useLanguage();

    const languages = [
        { code: 'ru' as const, label: 'Русский' },
        { code: 'en' as const, label: 'English' },
        { code: 'kk' as const, label: 'Қазақша' }
    ];

    const handleLanguageChange = (langCode: 'ru' | 'en' | 'kk') => {
        setLanguage(langCode);
    };

    const handleKeyDown = (e: React.KeyboardEvent, langCode: 'ru' | 'en' | 'kk') => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleLanguageChange(langCode);
        }
    };

    return (
        <div className={`flex gap-2 ${className}`}>
            {languages.map((lang) => {
                const isActive = language === lang.code;
                return (
                    <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        onKeyDown={(e) => handleKeyDown(e, lang.code)}
                        className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-all ${
                            isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-300'
                        }`}
                        aria-label={`Switch to ${lang.label}`}
                        aria-pressed={isActive}
                        tabIndex={0}
                    >
                        {lang.label}
                    </button>
                );
            })}
        </div>
    );
};

export default LanguageSwitcher;
