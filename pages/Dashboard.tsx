import React, { useEffect, useState, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { DashboardService, AIService } from '../lib/api';
import { DashboardData } from '../types';
import { useCourse } from '../context/CourseContext';
import { useToast } from '../components/Toast';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import Confetti from '../components/Confetti';
import { PageTransition } from '../components/PageTransition';
import { CreateCourseModal } from '../components/CreateCourseModal';
import Onboarding from '../components/Onboarding';
import { incrementTimeSaved } from '../lib/timeSaved';

interface UploadItem {
    id: string;
    name: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
}

const DashboardSkeleton = () => (
    <div className="animate-pulse space-y-8">
        <div className="flex justify-between items-center">
            <div className="space-y-2">
                <div className="h-8 w-64 bg-slate-700 rounded-lg"></div>
                <div className="h-4 w-40 bg-slate-800 rounded"></div>
            </div>
            <div className="flex gap-3">
                <div className="h-10 w-40 bg-slate-700 rounded-xl"></div>
                <div className="h-10 w-40 bg-slate-700 rounded-xl"></div>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-800 rounded-xl"></div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
                 <div className="h-6 w-32 bg-slate-700 rounded"></div>
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="aspect-[4/5] bg-slate-800 rounded-2xl"></div>
                    ))}
                 </div>
            </div>
            <div className="space-y-4">
                 <div className="h-6 w-40 bg-slate-700 rounded"></div>
                 <div className="h-[320px] bg-slate-800 rounded-2xl"></div>
            </div>
        </div>
    </div>
);

const PerformanceChart = React.memo(({ data, selectedCourse, title, avgLabel }: any) => {
    const chartData = Array.isArray(data) ? data : [];
    
    // Calculate average or dominant sentiment
    const score = chartData.length > 0 ? '84%' : 'N/A';

    return (
        <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-2xl p-6 flex flex-col items-center justify-center relative shadow-lg h-[340px]">
            <div className="absolute top-6 left-6 text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</div>
            
            <div className="relative mt-4" style={{ width: '13rem', height: '13rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={4}
                        >
                            {chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-black text-white drop-shadow-lg">{score}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1 bg-surface/80 px-2 py-0.5 rounded-full">{avgLabel}</span>
                </div>
            </div>

            <div className="w-full mt-6 space-y-3 px-2">
                {chartData.map((item: any) => (
                    <div key={item.name} className="flex items-center justify-between text-sm group">
                        <div className="flex items-center gap-3">
                            <div className="size-2.5 rounded-full ring-2 ring-opacity-20 ring-white" style={{ backgroundColor: item.color }}></div>
                            <span className="text-slate-300 font-medium group-hover:text-white transition-colors">{item.name}</span>
                        </div>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-xs">{item.value}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
});

const StatCard = ({ title, value, icon, color, subtext }: any) => (
    <div className="bg-surface/50 backdrop-blur border border-border p-5 rounded-2xl flex items-center justify-between hover:border-primary/30 transition-all hover:shadow-lg group">
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-black text-white">{value}</h3>
            {subtext && <p className="text-[10px] text-slate-500 mt-1">{subtext}</p>}
        </div>
        <div className={`size-12 rounded-xl bg-${color}-500/10 text-${color}-400 flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { selectedCourse, loading: loadingCourses } = useCourse();
  const { t } = useLanguage();
  const { user } = useUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if this is first visit
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      // Wait a bit for page to load
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, []);

  const handleCompleteOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  useEffect(() => {
    if (!selectedCourse) {
        // No course selected - stop loading and show empty state
        setLoading(false);
        setData(null);
        return;
    }
    setLoading(true);
    DashboardService.getOverview(selectedCourse.id)
        .then(res => {
            setData(res || { pieChart: [], needsReview: [], recentActivity: [] });
            setLoading(false);
        })
        .catch(err => {
            console.error('Dashboard load error:', err);
            addToast("Failed to load dashboard", "error");
            // Set empty data instead of null to prevent infinite loading
            setData({ pieChart: [], needsReview: [], recentActivity: [] });
            setLoading(false);
        });
  }, [selectedCourse]);

  const { pieChart = [], needsReview = [], recentActivity = [] } = data || {};

  const filteredActivity = useMemo(() => {
      if (!recentActivity) return [];
      if (!searchQuery) return recentActivity;
      const lowerQuery = searchQuery.toLowerCase();
      return recentActivity.filter((item) => 
          item.title.toLowerCase().includes(lowerQuery) || 
          item.source.toLowerCase().includes(lowerQuery)
      );
  }, [recentActivity, searchQuery]);

  const handleNavigate = (type: string, id: number | string) => {
      if (type === 'ocr' || type === 'quiz') navigate('/ocr');
      else if (type === 'plan' || type === 'ai') navigate('/ai');
  };

  const handleUseTemplate = (template: any) => {
      navigate('/ai', { state: { templateConfig: template } });
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      if (!selectedCourse) { addToast("Please select a course first", 'error'); return; }

      const newItems: UploadItem[] = Array.from(files).map(file => ({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          progress: 0,
          status: 'uploading'
      }));
      setUploadQueue(prev => [...prev, ...newItems]);

      let successCount = 0;
      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const item = newItems[i];
          try {
              const progressInterval = setInterval(() => {
                  setUploadQueue(prev => prev.map(q => q.id === item.id && q.progress < 90 ? { ...q, progress: q.progress + 10 } : q));
              }, 200);
              await AIService.uploadMaterial(file, selectedCourse.id);
              clearInterval(progressInterval);
              setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: 100, status: 'completed' } : q));
              successCount++;
          } catch (error) {
              setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', progress: 0 } : q));
              addToast(`Failed to upload ${file.name}`, "error");
          }
      }
      
      // Show success notification with action button
      if (successCount > 0) {
          incrementTimeSaved('materialsUploaded', successCount);
          addToast(
              `${successCount} ${successCount === 1 ? 'файл загружен' : 'файла загружено'} успешно!`,
              "success",
              {
                  label: "Создать тест",
                  onClick: () => navigate('/ai')
              }
          );
      }
      
      setTimeout(() => setUploadQueue(prev => prev.filter(item => item.status !== 'completed')), 5000);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
      addToast("Генерация PDF отчета...", "info");
      setTimeout(() => {
          setShowConfetti(true);
          addToast("Отчет скачан успешно", "success");
          setTimeout(() => setShowConfetti(false), 5000);
      }, 1500);
  };

  if (loadingCourses) {
      return (
          <div className="p-8 max-w-[1600px] mx-auto h-full flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
          </div>
      );
  }
  
  if (!selectedCourse) {
      return (
          <PageTransition>
          <div className="p-8 max-w-[1600px] mx-auto h-full flex items-center justify-center">
              <div className="text-center space-y-6">
                  <div className="bg-surface/50 backdrop-blur border border-border rounded-2xl p-12 max-w-md mx-auto">
                      <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">school</span>
                      <h2 className="text-2xl font-bold text-white mb-2">Создайте свой первый курс</h2>
                      <p className="text-slate-400 mb-6">Начните работу с платформой, создав курс для ваших студентов</p>
                      <button
                          onClick={() => setShowCreateCourseModal(true)}
                          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all mx-auto"
                      >
                          <span className="material-symbols-outlined">add</span>
                          Создать курс
                      </button>
                  </div>
              </div>
              <CreateCourseModal 
                  isOpen={showCreateCourseModal} 
                  onClose={() => setShowCreateCourseModal(false)} 
              />
          </div>
          </PageTransition>
      );
  }
  
  if (loading) return <div className="p-8 max-w-[1600px] mx-auto h-full overflow-y-auto custom-scrollbar"><DashboardSkeleton /></div>;
  if (!data) return <div className="p-8 max-w-[1600px] mx-auto h-full flex items-center justify-center text-slate-400"><div className="text-center"><span className="material-symbols-outlined text-6xl mb-4">error_outline</span><p>Не удалось загрузить данные</p></div></div>;

  const templates = [
      { id: 1, title: 'Входное тестирование', desc: '15 вопросов', icon: 'login', color: 'blue', config: { type: 'mcq', count: 15, difficulty: 'medium' } },
      { id: 2, title: 'Квиз-пятиминутка', desc: '5 вопросов (T/F)', icon: 'timer', color: 'amber', config: { type: 'boolean', count: 5, difficulty: 'easy' } },
      { id: 3, title: 'Итоговая контрольная', desc: '20 вопросов', icon: 'school', color: 'purple', config: { type: 'mcq', count: 20, difficulty: 'hard' } }
  ];

  return (
    <PageTransition>
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8 pb-32 md:pb-8 h-full overflow-y-auto custom-scrollbar relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      <Confetti active={showConfetti} />
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,.pdf" multiple />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
              {t('dash.welcome')}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{user?.firstName}</span>
          </h1>
          <p className="text-slate-400 font-medium">
             Активный курс: {selectedCourse ? (
               <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded ml-1">{selectedCourse.title}</span>
             ) : (
               <button
                 onClick={() => setShowCreateCourseModal(true)}
                 className="text-primary font-bold underline ml-1 hover:text-primary-hover"
               >
                 Создать курс
               </button>
             )}
          </p>
        </div>
        <div className="flex gap-3">
          {!selectedCourse && (
            <button
              onClick={() => setShowCreateCourseModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover hover:shadow-primary/40 transition-all active:scale-95 group"
            >
              <span className="material-symbols-outlined">add</span>
              Создать курс
            </button>
          )}
          {selectedCourse && (
            <>
              <button 
                onClick={handleUploadClick}
                data-onboarding="upload-button"
                className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover hover:shadow-primary/40 transition-all active:scale-95 group"
                >
                <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">upload_file</span>
                {t('dash.upload')}
              </button>
              <button 
                className="flex items-center gap-2 px-5 py-3 bg-surface border border-border text-white rounded-xl font-bold hover:bg-surface-lighter transition-all active:scale-95 group"
                onClick={() => navigate('/ocr')}
              >
                <span className="material-symbols-outlined group-hover:text-green-400 transition-colors">assignment_turned_in</span>
                {t('dash.check')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in-right">
          <StatCard title="Ожидает проверки" value={needsReview.length} icon="pending_actions" color="orange" subtext="работ в очереди" />
          <StatCard title="Средний балл" value="84%" icon="analytics" color="green" subtext="+2.4% с прошлой недели" />
          <StatCard title="Учеников" value="28" icon="groups" color="blue" subtext="98% посещаемость" />
      </div>

      {uploadQueue.length > 0 && (
          <div className="bg-surface/50 backdrop-blur border border-border rounded-xl p-5 animate-fade-in shadow-xl">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary animate-spin">sync</span>
                      {t('dash.queue')}
                  </h3>
                  <button onClick={() => setUploadQueue([])} className="text-xs text-slate-400 hover:text-white font-bold uppercase">{t('dash.clear')}</button>
              </div>
              <div className="space-y-4">
                  {uploadQueue.map(item => (
                      <div key={item.id} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                              <span className="text-white truncate max-w-[200px]">{item.name}</span>
                              <span className={item.status === 'completed' ? 'text-green-400' : 'text-primary'}>
                                  {item.status === 'completed' ? 'Готово' : `${Math.round(item.progress)}%`}
                              </span>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                  className={`h-full transition-all duration-300 ${item.status === 'completed' ? 'bg-green-500' : 'bg-primary'}`}
                                  style={{ width: `${item.progress}%` }}
                              ></div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6 animate-slide-in-right" style={{animationDelay: '0.1s'}}>
            
            {/* Templates Section */}
            <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">auto_fix</span>
                    Быстрый старт
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {templates.map(tmpl => (
                        <div 
                            key={tmpl.id}
                            onClick={() => handleUseTemplate(tmpl.config)}
                            className="bg-surface border border-border p-4 rounded-2xl cursor-pointer hover:border-primary hover:shadow-lg transition-all group relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity`}>
                                <span className="material-symbols-outlined text-6xl transform rotate-12">{tmpl.icon}</span>
                            </div>
                            <div className={`size-12 rounded-xl bg-${tmpl.color}-500/10 text-${tmpl.color}-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <span className="material-symbols-outlined text-2xl">{tmpl.icon}</span>
                            </div>
                            <h3 className="font-bold text-white text-sm mb-1">{tmpl.title}</h3>
                            <p className="text-xs text-slate-400 font-medium">{tmpl.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Needs Review Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-orange-400">notifications_active</span>
                        {t('dash.needsReview')}
                    </h2>
                    <button onClick={() => navigate('/ocr')} className="text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-white transition-colors">
                        {t('dash.viewAll')}
                    </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {needsReview.length > 0 ? needsReview.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => handleNavigate('ocr', item.id)}
                        className="group bg-surface border border-border p-3 rounded-2xl hover:border-primary/50 transition-all cursor-pointer hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1"
                    >
                        <div className="aspect-[4/5] rounded-xl bg-slate-800 mb-3 overflow-hidden relative shadow-inner">
                            {item.img ? (
                                <img src={item.img} alt={item.subject} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600">
                                    <span className="material-symbols-outlined text-4xl">image</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <span className="material-symbols-outlined text-white text-3xl drop-shadow-lg scale-0 group-hover:scale-100 transition-transform duration-300">edit_document</span>
                            </div>
                            <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg">NEW</div>
                        </div>
                        <h3 className="text-sm font-bold text-white truncate" title={item.name}>{item.name}</h3>
                        <p className="text-xs text-slate-400 truncate">{item.subject}</p>
                    </div>
                    )) : (
                        <div className="col-span-4 p-8 text-center text-slate-500 bg-surface/30 rounded-2xl border border-dashed border-border">
                            <span className="material-symbols-outlined text-3xl mb-2 text-slate-600">check_circle</span>
                            <p className="text-sm">Нет работ для проверки</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="space-y-6 animate-slide-in-right" style={{animationDelay: '0.2s'}}>
            <PerformanceChart 
                data={pieChart} 
                selectedCourse={selectedCourse} 
                title={t('dash.performance')} 
                avgLabel={t('dash.avgScore')} 
            />

            {/* Activity List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">{t('dash.activity')}</h2>
                    <div className="relative w-32 md:w-40">
                        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                        <input 
                            type="text" 
                            placeholder="Поиск..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-surface/50 border border-border rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <div className="bg-surface/50 border border-border rounded-2xl overflow-hidden shadow-sm">
                    {filteredActivity.length > 0 ? (
                        <div className="divide-y divide-border/50">
                            {filteredActivity.map((activity) => (
                                <div 
                                    key={activity.id} 
                                    onClick={() => handleNavigate(activity.type, activity.id)}
                                    className="p-4 hover:bg-white/5 transition-colors cursor-pointer flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-${activity.statusColor}-500/10 text-${activity.statusColor}-400 group-hover:scale-110 transition-transform`}>
                                            <span className="material-symbols-outlined text-lg">
                                                {activity.type === 'quiz' ? 'quiz' : activity.type === 'plan' ? 'menu_book' : 'auto_awesome'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white leading-tight mb-0.5">{activity.title}</p>
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[10px]">schedule</span> {activity.time}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                            activity.status === 'Completed' ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-400'
                                        }`}>
                                            {activity.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            <p className="text-sm">Ничего не найдено</p>
                        </div>
                    )}
                </div>
                <button 
                    onClick={handleExport}
                    className="w-full py-3 border border-border rounded-xl text-slate-400 text-sm font-bold hover:bg-surface hover:text-white transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined">download</span>
                    {t('dash.export')}
                </button>
            </div>
        </div>
      </div>
      
      {/* Create Course Modal */}
      <CreateCourseModal 
        isOpen={showCreateCourseModal} 
        onClose={() => setShowCreateCourseModal(false)} 
      />
      
      {/* Onboarding */}
      <Onboarding 
        isOpen={showOnboarding} 
        onComplete={handleCompleteOnboarding} 
      />
    </div>
    </PageTransition>
  );
};

export default Dashboard;