import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCourse, CourseType } from '../context/CourseContext';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedCourse, setCourse } = useCourse();
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 border-r border-border bg-background flex flex-col justify-between p-4 h-full
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col gap-8">
          {/* Logo & Course Switcher */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined">school</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-bold leading-tight text-white">EduStream</h1>
                <p className="text-slate-400 text-xs">{t('nav.tools')}</p>
              </div>
            </div>
            
            {/* Course Selector */}
            <div className="relative px-2">
                <select 
                    value={selectedCourse}
                    onChange={(e) => setCourse(e.target.value as CourseType)}
                    className="w-full bg-surface/50 border border-border text-white text-sm rounded-lg py-2 pl-3 pr-8 appearance-none focus:outline-none focus:border-primary hover:bg-surface transition-colors cursor-pointer"
                >
                    <option value="9A">Математика 9 «А»</option>
                    <option value="10B">Геометрия 10 «Б»</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">unfold_more</span>
            </div>
            {/* Close button for mobile */}
            <button onClick={onClose} className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-primary text-white font-medium shadow-md shadow-primary/10'
                      : 'text-slate-400 hover:bg-surface hover:text-white'
                  }`}
                >
                  <span className={`material-symbols-outlined ${isActive ? 'filled-icon' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-1 pt-4 border-t border-border">
          {/* Time Saved Widget */}
          <div className="mx-1 mb-4 p-3 bg-gradient-to-r from-primary/10 to-indigo-500/10 border border-primary/20 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-40 transition-opacity">
                <span className="material-symbols-outlined text-4xl">timer</span>
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">{t('nav.saved').replace('сэкономлено с ИИ', 'Твой вклад').replace('saved with AI', 'Your Impact')}</div>
            <div className="text-lg font-bold text-white flex items-center gap-1">
                <span className="material-symbols-outlined text-yellow-400 text-xl filled-icon">bolt</span> 
                12.5 h
            </div>
            <p className="text-[10px] text-slate-500">{t('nav.saved')}</p>
          </div>

          <button 
              onClick={toggleLanguage}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface transition-colors text-slate-400 hover:text-white"
          >
            <span className="material-symbols-outlined">translate</span>
            <span className="text-sm uppercase">{language}</span>
          </button>
          
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface transition-colors text-slate-400 hover:text-white">
            <span className="material-symbols-outlined">help</span>
            <span className="text-sm">{t('nav.support')}</span>
          </button>
          <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-slate-400"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm">{t('nav.logout')}</span>
          </button>
          
          <div className="flex items-center gap-3 px-3 py-2 mt-2 bg-surface rounded-xl border border-border group cursor-pointer hover:bg-white/5 transition-colors">
            <div className="relative">
                <div 
                  className="bg-center bg-no-repeat bg-cover rounded-full size-8 border border-slate-500"
                  style={{ backgroundImage: user?.avatar ? `url("${user.avatar}")` : undefined, backgroundColor: '#334155' }}
                ></div>
                {/* Online Indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-green-500 border-2 border-surface rounded-full"></div>
            </div>
            <div className="overflow-hidden">
               <p className="text-xs font-bold text-white truncate">{user ? `${user.firstName} ${user.lastName}` : 'Загрузка...'}</p>
               <p className="text-xs text-slate-400 truncate">{user?.role || 'Учитель'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;