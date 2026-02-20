import React, { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { ToastProvider } from './components/Toast';
import { CourseProvider } from './context/CourseContext';
import { SettingsProvider } from './context/SettingsContext';
import { LanguageProvider } from './context/LanguageContext';
import { UserProvider } from './context/UserContext';
import { useUser } from './context/UserContext';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const OCR = lazy(() => import('./pages/OCR'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AIWorkspace = lazy(() => import('./pages/AIWorkspace'));
const Library = lazy(() => import('./pages/Library'));
const MaterialsLibrary = lazy(() => import('./pages/MaterialsLibrary'));
const TeacherQuizPreview = lazy(() => import('./pages/TeacherQuizPreview'));
const Assignments = lazy(() => import('./pages/Assignments'));
const SharedQuiz = lazy(() => import('./pages/SharedQuiz'));
const QuizResults = lazy(() => import('./pages/QuizResults'));
const Settings = lazy(() => import('./pages/Settings'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentAssignments = lazy(() => import('./pages/StudentAssignments'));
const StudentTests = lazy(() => import('./pages/StudentTests'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

const RouteLoader: React.FC = () => (
  <div className="h-full min-h-screen flex items-center justify-center bg-background">
    <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
  </div>
);

// Компонент защиты маршрутов
const ProtectedRoute = () => {
  const hasToken = Boolean(localStorage.getItem('token'));
  const legacyFlag = localStorage.getItem('isLoggedIn') === 'true';
  const isAuthenticated = hasToken || legacyFlag;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const RoleRoute: React.FC<{ allowedRoles: Array<'teacher' | 'student' | 'admin'> }> = ({ allowedRoles }) => {
  const { user, isLoading } = useUser();
  const fallbackRole = localStorage.getItem('userRole');
  const role = String(user?.role || fallbackRole || '').toLowerCase();

  if (isLoading && !role) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role as 'teacher' | 'student' | 'admin')) {
    return <Navigate to={role === 'student' ? '/student' : '/dashboard'} replace />;
  }

  return <Outlet />;
};

const HomeRedirect: React.FC = () => {
  const { user, isLoading } = useUser();
  const fallbackRole = localStorage.getItem('userRole');
  const role = String(user?.role || fallbackRole || '').toLowerCase();

  if (isLoading && !role) {
    return (
      <div className="h-full flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
      </div>
    );
  }

  return <Navigate to={role === 'student' ? '/student' : '/dashboard'} replace />;
};

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (path: string) => {
    if (path.startsWith('/quiz/')) return 'Предпросмотр теста';

    switch (path) {
      case '/student': return 'Мой кабинет';
      case '/student-assignments': return 'Мои задания';
      case '/student-tests': return 'Мои тесты';
      case '/dashboard': return 'Дашборд';
      case '/assignments': return 'Задания';
      case '/ocr': return 'Проверка работ';
      case '/analytics': return 'Аналитика';
      case '/ai': return 'AI Ассистент';
      case '/materials-library': return 'Библиотека файлов';
      case '/quiz-results': return 'Результаты';
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
    <div className="flex h-[100dvh] bg-background text-white overflow-hidden font-sans flex-col md:flex-row">
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
                <Suspense fallback={<RouteLoader />}>
                  <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      
                      <Route element={<ProtectedRoute />}>
                      <Route element={<Layout />}>
                        <Route element={<RoleRoute allowedRoles={['student']} />}>
                          <Route path="/student" element={<StudentDashboard />} />
                          <Route path="/student-assignments" element={<StudentAssignments />} />
                          <Route path="/student-tests" element={<StudentTests />} />
                        </Route>

                        <Route element={<RoleRoute allowedRoles={['teacher', 'admin']} />}>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/assignments" element={<Assignments />} />
                          <Route path="/ocr" element={<OCR />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/ai" element={<AIWorkspace />} />
                          <Route path="/materials-library" element={<MaterialsLibrary />} />
                          <Route path="/quiz/:quizId" element={<TeacherQuizPreview />} />
                          <Route path="/quiz-results" element={<QuizResults />} />
                          <Route path="/library" element={<Library />} />
                        </Route>

                        <Route element={<RoleRoute allowedRoles={['teacher', 'student', 'admin']} />}>
                          <Route path="/settings" element={<Settings />} />
                        </Route>
                      </Route>
                      </Route>

                        <Route path="/shared/:code" element={<SharedQuiz />} />

                      <Route path="/" element={<HomeRedirect />} />
                  </Routes>
                </Suspense>
                </HashRouter>
              </UserProvider>
            </CourseProvider>
            </ToastProvider>
        </SettingsProvider>
    </LanguageProvider>
  );
};

export default App;