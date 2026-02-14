import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { AuthService } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { PageTransition } from '../components/PageTransition';

const DRAWN_AVATARS = [
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Aru&backgroundColor=b6e3f4,c0aede,d1d4f9',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Noor&backgroundColor=b6e3f4,c0aede,d1d4f9',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Kira&backgroundColor=b6e3f4,c0aede,d1d4f9',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&backgroundColor=b6e3f4,c0aede,d1d4f9',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Iris&backgroundColor=b6e3f4,c0aede,d1d4f9',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Arman&backgroundColor=b6e3f4,c0aede,d1d4f9',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Aya&backgroundColor=b6e3f4,c0aede,d1d4f9',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Timur&backgroundColor=b6e3f4,c0aede,d1d4f9',
    'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=b6e3f4,c0aede,d1d4f9',
];

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { t, language, setLanguage } = useLanguage();
    const { refreshUser } = useUser();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        avatar: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        AuthService.getCurrentUser()
            .then(user => {
                setFormData({
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    avatar: user.avatar
                });
                setLoading(false);
            })
            .catch(() => {
                addToast('Не удалось загрузить профиль пользователя', 'error');
            });
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        window.dispatchEvent(new Event('authChanged'));
        navigate('/login');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAvatarImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            addToast('Можно импортировать только изображения', 'error');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            if (result) {
                setFormData(prev => ({ ...prev, avatar: result }));
                addToast('Аватар импортирован', 'success');
            }
        };
        reader.onerror = () => {
            addToast('Не удалось импортировать аватар', 'error');
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await AuthService.updateUserProfile(formData);
            await refreshUser();
            addToast(t('settings.save'), 'success');
        } catch (e) {
            addToast('Ошибка при сохранении профиля', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
            </div>
        );
    }

    return (
        <PageTransition>
            <div className="flex h-full bg-background overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-32 md:pb-8">
                    <div className="border-b border-border pb-6 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{t('settings.title')}</h1>
                            <p className="text-slate-400 mt-1">{t('settings.subtitle')}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 border border-red-500/20 transition-all text-sm font-bold"
                        >
                            <span className="material-symbols-outlined text-lg">logout</span>
                            {t('nav.logout')}
                        </button>
                    </div>

                    <div className="max-w-3xl space-y-6 animate-fade-in">
                        <div className="bg-surface border border-border rounded-xl p-6">
                            <h2 className="text-lg font-bold text-white mb-6">{t('settings.profile')}</h2>
                            <div className="flex flex-col md:flex-row items-start gap-6">
                                <div className="relative group cursor-pointer self-center md:self-start">
                                    <div
                                        className="size-20 rounded-full bg-slate-700 bg-center bg-cover border-2 border-primary"
                                        style={{ backgroundImage: `url("${formData.avatar || DRAWN_AVATARS[0]}")` }}
                                    ></div>
                                </div>
                                <div className="flex-1 space-y-4 w-full">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('settings.name')}</label>
                                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('settings.surname')}</label>
                                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('settings.email')}</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Нарисованные аватары</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {DRAWN_AVATARS.map((avatarUrl) => {
                                                const isSelected = formData.avatar === avatarUrl;
                                                return (
                                                    <button
                                                        key={avatarUrl}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, avatar: avatarUrl }))}
                                                        className={`size-12 rounded-full border-2 bg-center bg-cover transition-all ${isSelected ? 'border-primary scale-110' : 'border-border hover:border-slate-400'}`}
                                                        style={{ backgroundImage: `url("${avatarUrl}")` }}
                                                        title="Выбрать аватар"
                                                    />
                                                );
                                            })}
                                        </div>
                                        <div>
                                            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-slate-300 hover:text-white hover:bg-surface-lighter cursor-pointer transition-colors">
                                                <span className="material-symbols-outlined text-base">upload</span>
                                                Импорт аватара
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleAvatarImport}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface border border-border rounded-xl p-6">
                            <h2 className="text-lg font-bold text-white mb-6">{t('settings.language')} / {t('nav.support')}</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                                            <span className="material-symbols-outlined">translate</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{t('settings.language')}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setLanguage('en')} className={`px-2 py-1 text-xs font-bold rounded ${language === 'en' ? 'bg-primary text-white' : 'bg-slate-700 text-slate-400'}`}>EN</button>
                                        <button onClick={() => setLanguage('ru')} className={`px-2 py-1 text-xs font-bold rounded ${language === 'ru' ? 'bg-primary text-white' : 'bg-slate-700 text-slate-400'}`}>RU</button>
                                    </div>
                                </div>

                                <a
                                    href="mailto:support@edustream.local"
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                                            <span className="material-symbols-outlined">help</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{t('nav.support')}</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400">open_in_new</span>
                                </a>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2.5 rounded-xl border border-border text-white font-bold hover:bg-surface-lighter transition-all"
                                disabled={saving}
                            >
                                {t('settings.cancel')}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all flex items-center gap-2 disabled:opacity-70"
                            >
                                {saving && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                                {t('settings.save')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default Settings;
