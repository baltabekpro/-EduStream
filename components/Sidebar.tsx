import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCourse } from '../context/CourseContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { courses, selectedCourse, selectCourse, loading: loadingCourses } = useCourse();
  const { t, language, setLanguage } = useLanguage();
  const { user } = useUser();

  const menuItems = [
    { icon: 'dashboard', label: t('nav.dashboard'), path: '/dashboard' },
    { icon: 'document_scanner', label: t('nav.ocr'), path: '/ocr' },
    { icon: 'auto_awesome', label: t('nav.ai'), path: '/ai' },
    { icon: 'bar_chart', label: t('nav.analytics'), path: '/analytics' },
    { icon: 'settings', label: t('nav.settings'), path: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose(); 
  };

  const toggleLanguage = () => {
      setLanguage(language === 'ru' ? 'en' : 'ru');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={onClose}
        ></div>
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-72 border-r border-border bg-[#0f172a] flex flex-col justify-between p-5 h-full
        transition-transform duration-300 ease-out shadow-2xl md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col gap-8">
          {/* Logo & Course Switcher */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="bg-gradient-to-br from-primary to-blue-600 size-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/25">
                <span className="material-symbols-outlined text-2xl">school</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold leading-tight text-white tracking-tight">EduStream</h1>
                <p className="text-slate-400 text-xs font-medium">{t('nav.tools')}</p>
              </div>
            </div>
            
            {/* Course Selector */}
            <div className="relative group" data-onboarding="course-selector">
                <select 
                    value={selectedCourse?.id || ''}
                    onChange={(e) => {
                        const course = courses.find(c => c.id === e.target.value);
                        selectCourse(course || null);
                    }}
                    disabled={loadingCourses}
                    className="w-full bg-surface/50 border border-border text-white text-sm rounded-xl py-3 pl-4 pr-10 appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary hover:bg-surface hover:border-slate-500 transition-all cursor-pointer disabled:opacity-50 font-medium shadow-sm"
                >
                    {loadingCourses ? (
                        <option>Загрузка...</option>
                    ) : courses.length > 0 ? (
                        courses.map(course => (
                            <option key={course.id} value={course.id}>{course.title}</option>
                        ))
                    ) : (
                        <option value="" disabled>Нет курсов</option>
                    )}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col text-slate-400 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-xs -mb-1">expand_less</span>
                    <span className="material-symbols-outlined text-xs">expand_more</span>
                </div>
            </div>

            {/* Close button for mobile */}
            <button onClick={onClose} className="md:hidden absolute top-5 right-5 text-slate-400 hover:text-white transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isAILink = item.path === '/ai';
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  data-onboarding={isAILink ? 'ai-link' : undefined}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${
                    isActive
                      ? 'bg-primary text-white font-medium shadow-lg shadow-primary/20'
                      : 'text-slate-400 hover:bg-surface hover:text-white'
                  }`}
                >
                   {isActive && (
                       <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                   )}
                  <span className={`material-symbols-outlined transition-transform group-hover:scale-110 ${isActive ? 'filled-icon' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="text-sm tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-2 pt-6 border-t border-border/50">
          {/* Time Saved Widget */}
          <div className="mb-4 p-4 bg-gradient-to-br from-indigo-600/20 via-primary/20 to-purple-600/20 border border-primary/20 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <span className="material-symbols-outlined text-6xl">timer</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
            
            <div className="relative z-10">
                <div className="text-[10px] text-primary-300 uppercase font-bold tracking-widest mb-1.5">{t('nav.saved').replace('сэкономлено с ИИ', 'Твой вклад').replace('saved with AI', 'Impact')}</div>
                <div className="text-2xl font-black text-white flex items-center gap-1.5 mb-0.5">
                    <span className="material-symbols-outlined text-yellow-400 text-2xl filled-icon drop-shadow-lg animate-pulse-slow">bolt</span> 
                    12.5 h
                </div>
                <p className="text-[10px] text-slate-400 font-medium">{t('nav.saved')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
                onClick={toggleLanguage}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-surface transition-colors text-slate-400 hover:text-white border border-transparent hover:border-border"
            >
                <span className="material-symbols-outlined text-[18px]">translate</span>
                <span className="text-xs font-bold uppercase">{language}</span>
            </button>
            <button 
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-surface transition-colors text-slate-400 hover:text-white border border-transparent hover:border-border"
            >
                <span className="material-symbols-outlined text-[18px]">help</span>
                <span className="text-xs font-bold">{t('nav.support')}</span>
            </button>
          </div>

          <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors text-slate-400 group mt-1"
          >
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">logout</span>
            <span className="text-sm font-medium">{t('nav.logout')}</span>
          </button>
          
          <div className="flex items-center gap-3 px-4 py-3 mt-3 bg-surface/50 rounded-xl border border-border/50 group cursor-pointer hover:bg-surface hover:border-slate-500/50 transition-all shadow-sm">
            <div className="relative">
                <div 
                  className="bg-center bg-no-repeat bg-cover rounded-full size-9 border-2 border-slate-600 group-hover:border-primary transition-colors shadow-md"
                  style={{ backgroundImage: user?.avatar ? `url("${user.avatar}")` : undefined, backgroundColor: '#334155' }}
                ></div>
                <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-green-500 border-2 border-[#1e293b] rounded-full ring-1 ring-black/20"></div>
            </div>
            <div className="overflow-hidden flex-1">
               <p className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                   {user ? `${user.firstName} ${user.lastName}` : 'Загрузка...'}
               </p>
               <p className="text-[11px] text-slate-400 truncate">{user?.role || 'Teacher'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;