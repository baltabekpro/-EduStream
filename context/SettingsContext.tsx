import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsState {
    notifications: {
        lowPerformance: boolean; // Уведомлять о низкой успеваемости
        reports: boolean;        // Отчет готов
        errors: boolean;         // Ошибки системы (например, OCR)
    };
}

interface SettingsContextType {
    settings: SettingsState;
    updateSettings: (newSettings: Partial<SettingsState['notifications']>) => void;
}

const defaultSettings: SettingsState = {
    notifications: {
        lowPerformance: true,
        reports: true,
        errors: true
    }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SettingsState>(() => {
        const saved = localStorage.getItem('appSettings');
        return saved ? JSON.parse(saved) : defaultSettings;
    });

    useEffect(() => {
        localStorage.setItem('appSettings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (newNotifications: Partial<SettingsState['notifications']>) => {
        setSettings(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                ...newNotifications
            }
        }));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};