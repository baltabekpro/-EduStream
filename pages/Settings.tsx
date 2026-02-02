import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { AuthService } from '../lib/api';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { PageTransition } from '../components/PageTransition';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { settings, updateSettings } = useSettings();
  const { t, language, setLanguage } = useLanguage();
  
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
            addToast("Failed to load user profile", "error");
        });
  }, []);

  const handleLogout = () => {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('token');
      navigate('/login');
  };

  const handleResetDemo = () => {
      if(window.confirm("Это сотрет все локальные данные. Продолжить?")) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
      setSaving(true);
      try {
          await AuthService.updateUserProfile(formData);
          addToast(t('settings.save'), "success");
      } catch (e) {
          addToast("Error saving profile", "error");
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
                    <p className="text-slate-400 mt-1">Manage profile and preferences</p>
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
                {/* Profile Section */}
                <div className="bg-surface border border-border rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-6">{t('settings.profile')}</h2>
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        <div className="relative group cursor-pointer self-center md:self-start">
                            <div 
                                className="size-20 rounded-full bg-slate-700 bg-center bg-cover border-2 border-primary"
                                style={{ backgroundImage: `url("${formData.avatar}")` }}
                            ></div>
                        </div>
                        <div className="flex-1 space-y-4 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name</label>
                                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Surname</label>
                                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div className="bg-surface border border-border rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-6">{t('settings.notifications')} / {t('settings.language')}</h2>
                    <div className="space-y-4">
                        <div 
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" 
                            onClick={() => updateSettings({ reports: !settings.notifications.reports })}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                    <span className="material-symbols-outlined">mail</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Email Reports</p>
                                </div>
                            </div>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.notifications.reports ? 'bg-primary' : 'bg-slate-700'}`}>
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.notifications.reports ? 'left-6' : 'left-1'}`}></div>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                                    <span className="material-symbols-outlined">translate</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Language / Язык</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setLanguage('en')} className={`px-2 py-1 text-xs font-bold rounded ${language === 'en' ? 'bg-primary text-white' : 'bg-slate-700 text-slate-400'}`}>EN</button>
                                <button onClick={() => setLanguage('ru')} className={`px-2 py-1 text-xs font-bold rounded ${language === 'ru' ? 'bg-primary text-white' : 'bg-slate-700 text-slate-400'}`}>RU</button>
                            </div>
                        </div>
                    </div>
                </div>

                 {/* Demo Zone */}
                 <div className="bg-surface border border-red-500/20 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-red-400 mb-2">{t('settings.demo')}</h2>
                    <p className="text-sm text-slate-400 mb-4">Resetting will clear all local changes and restore mock data.</p>
                    <button onClick={handleResetDemo} className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-bold hover:bg-red-500/20">
                        {t('settings.reset')}
                    </button>
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
