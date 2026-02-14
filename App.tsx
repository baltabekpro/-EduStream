import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import OCR from './pages/OCR';
import Analytics from './pages/Analytics';
import AIWorkspace from './pages/AIWorkspace';
import Library from './pages/Library';
import MaterialsLibrary from './pages/MaterialsLibrary';
import TeacherQuizPreview from './pages/TeacherQuizPreview';
import SharedQuiz from './pages/SharedQuiz';
import QuizResults from './pages/QuizResults';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import { ToastProvider } from './components/Toast';
import { CourseProvider } from './context/CourseContext';
import { SettingsProvider } from './context/SettingsContext';
import { LanguageProvider } from './context/LanguageContext';
import { UserProvider } from './context/UserContext';

// Компонент защиты маршрутов
const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (path: string) => {
    if (path.startsWith('/quiz/')) return 'Предпросмотр теста';

    switch (path) {
      case '/dashboard': return 'Дашборд';
      case '/ocr': return 'Проверка работ';
      case '/analytics': return 'Аналитика';
      case '/ai': return 'AI Ассистент';
      case '/materials-library': return 'Библиотека файлов';
      case '/quiz-results': return 'Результаты тестов';
      case '/library': return 'Библиотека тестов';
      case '/settings': return 'Настройки';
      default: return 'EduStream';
    }
  };

  // Глобальный обработчик ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsSidebarOpen(false);
        }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="flex h-screen bg-background text-white overflow-hidden font-sans flex-col md:flex-row">
      <div className="md:hidden flex items-center justify-between p-4 bg-surface border-b border-border z-30">
        <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(true)} className="text-slate-300">
                <span className="material-symbols-outlined">menu</span>
             </button>
             <h1 className="font-bold text-lg">{getPageTitle(location.pathname)}</h1>
        </div>
        <div 
            className="bg-center bg-no-repeat bg-cover rounded-full size-8 border border-slate-500"
            style={{ backgroundImage: 'url("https://picsum.photos/id/64/100/100")' }}
        ></div>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 overflow-hidden relative w-full">
        <Outlet />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
        <SettingsProvider>
            <ToastProvider>
            <CourseProvider>
              <UserProvider>
                <HashRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/ocr" element={<OCR />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/ai" element={<AIWorkspace />} />
                        <Route path="/materials-library" element={<MaterialsLibrary />} />
                        <Route path="/quiz/:quizId" element={<TeacherQuizPreview />} />
                        <Route path="/quiz-results" element={<QuizResults />} />
                        <Route path="/library" element={<Library />} />
                        <Route path="/settings" element={<Settings />} />
                    </Route>
                    </Route>

                      <Route path="/shared/:code" element={<SharedQuiz />} />

                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
                </HashRouter>
              </UserProvider>
            </CourseProvider>
            </ToastProvider>
        </SettingsProvider>
    </LanguageProvider>
  );
};

export default App;