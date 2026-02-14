import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { AuthService } from '../lib/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        addToast("Введите корректный Email", "error");
        return;
    }

    if (!password) {
        addToast("Введите пароль", "error");
        return;
    }

    setIsLoading(true);
    
    try {
        const { token, user } = await AuthService.login(email, password);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('token', token);
        const normalizedRole = String(user.role || '').toLowerCase();
        localStorage.setItem('userRole', normalizedRole);
        window.dispatchEvent(new Event('authChanged'));
        addToast("Добро пожаловать!", "success");
        navigate(normalizedRole === 'student' ? '/student' : '/dashboard');
    } catch (error: any) {
        addToast(error.message || "Неверный логин или пароль", "error");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 z-10">
        <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary text-2xl">school</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">EduStream</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-[400px] bg-surface/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl animate-fade-in p-8">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Вход в систему</h2>
            <p className="text-slate-400 text-sm">Введите свои данные для доступа</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">mail</span>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#0f172a] border border-border rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        placeholder="teacher@school.edu"
                        autoComplete="email"
                        required
                        disabled={isLoading}
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Пароль</label>
                    <a href="#" className="text-xs text-primary hover:text-primary-hover transition-colors">Забыли пароль?</a>
                </div>
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">lock</span>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#0f172a] border border-border rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                        disabled={isLoading}
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                ) : (
                    <>
                        <span>Войти</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <p className="text-sm text-slate-500">
                Еще нет аккаунта? <Link to="/register" className="text-white font-bold hover:text-primary transition-colors ml-1">Регистрация</Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-600 z-10">
        <p>&copy; 2024 EduStream Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;