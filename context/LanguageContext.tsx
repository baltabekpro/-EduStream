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
        'nav.tools': 'Инструменты учителя',
        'nav.saved': 'сэкономлено с ИИ',
        
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
        'ocr.selected': 'выбрано',
        'ocr.approveSelected': 'Подтвердить выбранные',
        'ocr.close': 'Закрыть',
        'ocr.saveChanges': 'Сохранить изменения',
        'ocr.th.student': 'Студент',
        'ocr.th.subject': 'Предмет',
        'ocr.th.accuracy': 'Точность',
        'ocr.th.status': 'Статус',
        'ocr.th.actions': 'Действия',
        'ocr.review': 'Проверить',
        'ocr.grade': 'Оценка',
        'ocr.caughtUp': 'Все проверено! Нет ожидающих работ.',
        'ocr.conf.high': 'Высокая точность',
        'ocr.conf.low': 'Низкая точность',
        
        'ai.typing': 'печатает...',
        'ai.ask': 'Спросить ИИ',
        'ai.analysis': 'Анализ',
        'ai.history': 'История сессий',
        'ai.newChat': 'Новый чат',
        'ai.placeholder': 'Задайте вопрос по материалу...',
        'ai.tab.canvas': 'AI Холст',
        'ai.tab.builder': 'Конструктор тестов',
        'ai.actions': 'Действия ИИ',
        'ai.action.explain': 'Объяснить',
        'ai.action.simplify': 'Упростить',
        'ai.action.translate': 'Перевести',
        'ai.difficulty': 'СЛОЖНОСТЬ',
        'ai.count': 'КОЛИЧЕСТВО',
        'ai.generate': 'Сгенерировать',
        'ai.generating': 'Генерация...',
        'ai.explanation': 'Объяснение',
        'ai.diff.easy': 'Легкий',
        'ai.diff.medium': 'Средний',
        'ai.diff.hard': 'Сложный',

        'analytics.title': 'Аналитика класса',
        'analytics.subtitle': 'Детальный обзор успеваемости',
        'analytics.average': 'Средний балл',
        'analytics.leaderboard': 'Рейтинг учеников',
        'analytics.back': 'Назад к обзору',
        'analytics.breakdown': 'Разбор по ученикам',

        'settings.title': 'Настройки',
        'settings.subtitle': 'Управление профилем и предпочтениями',
        'settings.profile': 'Профиль',
        'settings.name': 'Имя',
        'settings.surname': 'Фамилия',
        'settings.email': 'Email',
        'settings.emailReports': 'Email отчеты',
        'settings.notifications': 'Умные уведомления',
        'settings.language': 'Язык интерфейса',
        'settings.demo': 'Демо режим',
        'settings.demoDesc': 'Сброс очистит все локальные изменения и восстановит исходные данные.',
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
        'nav.tools': 'Teacher Tools',
        'nav.saved': 'saved with AI',

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
        'ocr.selected': 'selected',
        'ocr.approveSelected': 'Approve Selected',
        'ocr.close': 'Close',
        'ocr.saveChanges': 'Save Changes',
        'ocr.th.student': 'Student',
        'ocr.th.subject': 'Subject',
        'ocr.th.accuracy': 'Accuracy',
        'ocr.th.status': 'Status',
        'ocr.th.actions': 'Actions',
        'ocr.review': 'Review',
        'ocr.grade': 'Grade',
        'ocr.caughtUp': 'All caught up! No works pending.',
        'ocr.conf.high': 'High Confidence',
        'ocr.conf.low': 'Low Confidence',

        'ai.typing': 'is typing...',
        'ai.ask': 'Ask AI',
        'ai.analysis': 'Analysis',
        'ai.history': 'Session History',
        'ai.newChat': 'New Chat',
        'ai.placeholder': 'Ask a question about the material...',
        'ai.tab.canvas': 'AI Canvas',
        'ai.tab.builder': 'Test Builder',
        'ai.actions': 'AI Actions',
        'ai.action.explain': 'Explain',
        'ai.action.simplify': 'Simplify',
        'ai.action.translate': 'Translate',
        'ai.difficulty': 'DIFFICULTY',
        'ai.count': 'COUNT',
        'ai.generate': 'Generate',
        'ai.generating': 'Generating...',
        'ai.explanation': 'Explanation',
        'ai.diff.easy': 'Easy',
        'ai.diff.medium': 'Medium',
        'ai.diff.hard': 'Hard',

        'analytics.title': 'Class Analytics',
        'analytics.subtitle': 'Deep dive into performance',
        'analytics.average': 'Class Average',
        'analytics.leaderboard': 'Leaderboard',
        'analytics.back': 'Back to Overview',
        'analytics.breakdown': 'Student Breakdown',

        'settings.title': 'Settings',
        'settings.subtitle': 'Manage profile and preferences',
        'settings.profile': 'Profile',
        'settings.name': 'Name',
        'settings.surname': 'Surname',
        'settings.email': 'Email',
        'settings.emailReports': 'Email Reports',
        'settings.notifications': 'Smart Notifications',
        'settings.language': 'Interface Language',
        'settings.demo': 'Demo Mode',
        'settings.demoDesc': 'Resetting will clear all local changes and restore mock data.',
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
