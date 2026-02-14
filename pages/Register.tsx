import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { AuthService } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'teacher' as 'teacher' | 'student'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(formData.email)) {
        addToast("Пожалуйста, введите корректный рабочий email", "error");
        return;
    }
    
    if (formData.password.length < 6) {
        addToast("Пароль должен быть не менее 6 символов", "error");
        return;
    }

    setIsLoading(true);
    
    try {
        await AuthService.register(formData);
        addToast("Аккаунт создан успешно! Теперь войдите.", "success");
        navigate('/login');
    } catch (error: any) {
        addToast(error.message || "Ошибка регистрации", "error");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 z-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="material-symbols-outlined text-primary text-3xl">school</span>
            <h1 className="text-xl font-bold tracking-tight text-white">EduStream</h1>
        </div>
        <button className="px-4 py-2 rounded-lg bg-surface border border-border text-sm font-medium hover:bg-surface-lighter transition-colors text-slate-200">
            {t('nav.support')}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-[420px] bg-surface/50 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl animate-fade-in">
          <div className="flex flex-col items-center mb-8">
            <div className="size-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 text-primary">
                <span className="material-symbols-outlined text-3xl">person_add</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t('auth.createAccount')}</h2>
            <p className="text-slate-400 text-sm text-center">{t('auth.join')}</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Роль</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'teacher' }))}
                        className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${formData.role === 'teacher' ? 'bg-primary/15 border-primary text-white' : 'bg-[#111827] border-border text-slate-300 hover:text-white'}`}
                    >
                        Учитель
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
                        className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${formData.role === 'student' ? 'bg-primary/15 border-primary text-white' : 'bg-[#111827] border-border text-slate-300 hover:text-white'}`}
                    >
                        Ученик
                    </button>
                </div>
                <p className="text-xs text-slate-500">
                    {formData.role === 'teacher' ? 'Доступ к созданию курсов, материалов и проверке.' : 'Доступ к выполнению заданий и личному прогрессу.'}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">{t('auth.firstName')}</label>
                    <input 
                        type="text" 
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full bg-[#111827] border border-border rounded-lg py-2.5 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        required
                        disabled={isLoading}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">{t('auth.lastName')}</label>
                    <input 
                        type="text" 
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full bg-[#111827] border border-border rounded-lg py-2.5 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        required
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">{t('settings.email')}</label>
                <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-[#111827] border border-border rounded-lg py-2.5 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="imya@school.edu"
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">{t('auth.password')}</label>
                <input 
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-[#111827] border border-border rounded-lg py-2.5 px-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                />
            </div>

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
            >
                {isLoading ? (
                    <span className="material-symbols-outlined animate-spin">sync</span>
                ) : (
                    <>
                        <span>{t('auth.createAccount')}</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50 text-center space-y-4">
            <p className="text-xs text-slate-500">
                {t('auth.alreadyHaveAccount')} <Link to="/login" className="text-primary hover:underline">{t('auth.login')}</Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-600 z-10">
        <div className="flex justify-center gap-6 mb-2">
            <a href="#" className="hover:text-slate-400">Условия</a>
            <a href="#" className="hover:text-slate-400">Конфиденциальность</a>
            <a href="#" className="hover:text-slate-400">Контакты</a>
        </div>
        <p>&copy; 2024 EduStream International</p>
      </footer>
    </div>
  );
};

export default Register;