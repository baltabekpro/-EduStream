import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ru' | 'en';

type Translations = {
    [key in Language]: {
        [key: string]: string;
    };
};

const translations: Translations = {
    ru: {
        'nav.dashboard': 'Дашборд',
        'nav.ocr': 'OCR Проверка',
        'nav.ai': 'AI Ассистент',
        'nav.analytics': 'Аналитика',
        'nav.settings': 'Настройки',
        'nav.support': 'Поддержка',
        'nav.logout': 'Выйти',
        'dash.welcome': 'Доброе утро',
        'dash.upload': 'Загрузить материал',
        'dash.check': 'Проверить работы',
        'dash.needsReview': 'Требует проверки',
        'dash.viewAll': 'Смотреть все',
        'dash.performance': 'Успеваемость класса',
        'dash.avgScore': 'Средний балл',
        'dash.activity': 'Недавняя активность',
        'dash.search': 'Поиск по материалам...',
        'dash.export': 'Экспорт',
        'dash.queue': 'Очередь загрузки',
        'dash.clear': 'Очистить',
        'ocr.back': 'Назад',
        'ocr.save': 'Сохранить',
        'ocr.confirmAll': 'Подтвердить все',
        'ocr.unsaved': 'Не сохранено',
        'ocr.accuracy': 'Точность',
        'ai.typing': 'печатает...',
        'ai.ask': 'Спросить ИИ',
        'ai.analysis': 'Анализ',
        'ai.history': 'История сессий',
        'ai.newChat': 'Новый чат',
        'ai.placeholder': 'Задайте вопрос по материалу...',
        'settings.title': 'Настройки',
        'settings.profile': 'Профиль',
        'settings.notifications': 'Умные уведомления',
        'settings.language': 'Язык интерфейса',
        'settings.demo': 'Демо режим',
        'settings.reset': 'Сбросить данные к демо-версии',
        'settings.save': 'Сохранить',
        'settings.cancel': 'Отмена',
    },
    en: {
        'nav.dashboard': 'Dashboard',
        'nav.ocr': 'OCR Grader',
        'nav.ai': 'AI Assistant',
        'nav.analytics': 'Analytics',
        'nav.settings': 'Settings',
        'nav.support': 'Support',
        'nav.logout': 'Logout',
        'dash.welcome': 'Good morning',
        'dash.upload': 'Upload Material',
        'dash.check': 'Check Assignments',
        'dash.needsReview': 'Needs Review',
        'dash.viewAll': 'View All',
        'dash.performance': 'Class Performance',
        'dash.avgScore': 'Avg Score',
        'dash.activity': 'Recent Activity',
        'dash.search': 'Search materials...',
        'dash.export': 'Export',
        'dash.queue': 'Upload Queue',
        'dash.clear': 'Clear',
        'ocr.back': 'Back',
        'ocr.save': 'Save',
        'ocr.confirmAll': 'Confirm All',
        'ocr.unsaved': 'Unsaved',
        'ocr.accuracy': 'Accuracy',
        'ai.typing': 'is typing...',
        'ai.ask': 'Ask AI',
        'ai.analysis': 'Analysis',
        'ai.history': 'Session History',
        'ai.newChat': 'New Chat',
        'ai.placeholder': 'Ask a question about the material...',
        'settings.title': 'Settings',
        'settings.profile': 'Profile',
        'settings.notifications': 'Smart Notifications',
        'settings.language': 'Interface Language',
        'settings.demo': 'Demo Mode',
        'settings.reset': 'Reset to Demo Data',
        'settings.save': 'Save',
        'settings.cancel': 'Cancel',
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        return (localStorage.getItem('appLanguage') as Language) || 'ru';
    });

    useEffect(() => {
        localStorage.setItem('appLanguage', language);
    }, [language]);

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};