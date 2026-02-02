import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { AuthService } from '../lib/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [method, setMethod] = useState<'magic' | 'password'>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        navigate('/dashboard');
    }
  }, [navigate]);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
        addToast("Пожалуйста, введите корректный рабочий email", "error");
        return;
    }

    setIsLoading(true);
    
    try {
        const { token } = await AuthService.login(email, method === 'password' ? password : undefined);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('token', token);
        addToast("Успешный вход в систему", "success");
        navigate('/dashboard');
    } catch (error: any) {
        addToast(error.message || "Ошибка входа", "error");
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
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">school</span>
            <h1 className="text-xl font-bold tracking-tight text-white">EduStream</h1>
        </div>
        <button className="px-4 py-2 rounded-lg bg-surface border border-border text-sm font-medium hover:bg-surface-lighter transition-colors text-slate-200">
            Поддержка
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-[420px] bg-surface/50 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="size-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 text-primary">
                <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">С возвращением</h2>
            <p className="text-slate-400 text-sm text-center">Войдите, чтобы продолжить работу</p>
          </div>

          <div className="flex border-b border-border mb-8">
            <button 
                onClick={() => setMethod('magic')}
                className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${method === 'magic' ? 'border-primary text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
                Магическая ссылка
            </button>
            <button 
                onClick={() => setMethod('password')}
                className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${method === 'password' ? 'border-primary text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
                Пароль
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email адрес</label>
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">mail</span>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#111827] border border-border rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
                        placeholder="imya@school.edu"
                        required
                        disabled={isLoading}
                    />
                </div>
            </div>

            {method === 'password' && (
                <div className="space-y-2 animate-fade-in">
                    <label className="text-sm font-medium text-slate-300">Пароль</label>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xl">key</span>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#111827] border border-border rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
                            placeholder="••••••••"
                            required
                            disabled={isLoading}
                        />
                    </div>
                </div>
            )}

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
            >
                {isLoading ? (
                    <span className="material-symbols-outlined animate-spin">sync</span>
                ) : (
                    <>
                        <span>{method === 'magic' ? 'Отправить ссылку' : 'Войти'}</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50 text-center space-y-4">
            <p className="text-xs text-slate-500">
                Нет аккаунта? <a href="#" className="text-primary hover:underline">Создать аккаунт</a>
            </p>
            <div className="flex items-center justify-center gap-2 text-slate-600 text-xs">
                <span className="material-symbols-outlined text-xs">shield</span>
                <span>Защищенное соединение</span>
            </div>
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

export default Login;
