import React, { useEffect, useState, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { currentUser } from '../data/mockData';
import { DashboardService } from '../lib/api';
import { DashboardData } from '../types';
import { useCourse } from '../context/CourseContext';
import { useToast } from '../components/Toast';
import { useLanguage } from '../context/LanguageContext';
import Confetti from '../components/Confetti';
import { PageTransition } from '../components/PageTransition';

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
        <div className="space-y-4">
             <div className="h-6 w-40 bg-slate-700 rounded"></div>
             <div className="h-64 bg-slate-800 rounded-2xl"></div>
        </div>
    </div>
);

const PerformanceChart = React.memo(({ data, selectedCourse, title, avgLabel }: any) => (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center justify-center relative shadow-sm h-[320px]">
        <div className="relative" style={{ width: '12rem', height: '12rem' }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-white">{selectedCourse === '9A' ? '84%' : '76%'}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-1">{avgLabel}</span>
            </div>
        </div>

        <div className="w-full mt-6 space-y-3">
            {data.map((item: any) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-slate-300">{item.name}</span>
                    </div>
                    <span className="font-bold text-white">{item.value}%</span>
                </div>
            ))}
        </div>
    </div>
));

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { selectedCourse } = useCourse();
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    DashboardService.getOverview(selectedCourse)
        .then(res => {
            setData(res);
            setLoading(false);
        })
        .catch(err => {
            addToast("Failed to load dashboard", "error");
            setLoading(false);
        });
  }, [selectedCourse]);

  const filteredActivity = useMemo(() => {
      if (!data) return [];
      if (!searchQuery) return data.recentActivity;
      const lowerQuery = searchQuery.toLowerCase();
      return data.recentActivity.filter((item) => 
          item.title.toLowerCase().includes(lowerQuery) || 
          item.source.toLowerCase().includes(lowerQuery)
      );
  }, [data, searchQuery]);

  const handleNavigate = (type: string, id: number | string) => {
      if (type === 'ocr' || type === 'quiz') {
          navigate('/ocr');
      } else if (type === 'plan' || type === 'ai') {
          navigate('/ai');
      }
  };

  const handleUseTemplate = (template: any) => {
      navigate('/ai', { state: { templateConfig: template } });
  };

  const handleUploadClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          const newItems: UploadItem[] = Array.from(files).map(file => ({
              id: Math.random().toString(36).substr(2, 9),
              name: file.name,
              progress: 0,
              status: 'uploading'
          }));
          
          setUploadQueue(prev => [...prev, ...newItems]);
          addToast(`Добавлено ${files.length} файлов в очередь`, "info");

          newItems.forEach(item => {
              const duration = 1500 + Math.random() * 2000;
              const interval = 100;
              const step = 100 / (duration / interval);
              
              const timer = setInterval(() => {
                  setUploadQueue(prev => prev.map(q => {
                      if (q.id === item.id) {
                          const newProgress = Math.min(100, q.progress + step);
                          if (newProgress === 100) {
                              clearInterval(timer);
                              return { ...q, progress: 100, status: 'completed' };
                          }
                          return { ...q, progress: newProgress };
                      }
                      return q;
                  }));
              }, interval);
          });
          
          setTimeout(() => {
              setUploadQueue(prev => prev.filter(item => item.status !== 'completed'));
              addToast("Все файлы успешно загружены", "success");
          }, 6000);
      }
  };

  const handleExport = () => {
      addToast("Генерация PDF отчета...", "info");
      setTimeout(() => {
          setShowConfetti(true);
          addToast("Отчет скачан успешно", "success");
          setTimeout(() => setShowConfetti(false), 5000);
      }, 1500);
  };

  if (loading || !data) {
      return (
          <div className="p-8 max-w-[1600px] mx-auto h-full overflow-y-auto custom-scrollbar">
              <DashboardSkeleton />
          </div>
      );
  }

  const { pieChart, needsReview } = data;

  const templates = [
      { 
          id: 1, 
          title: 'Входное тестирование', 
          desc: '15 вопросов для оценки базовых знаний', 
          icon: 'login', 
          color: 'blue',
          config: { type: 'mcq', count: 15, difficulty: 'medium' }
      },
      { 
          id: 2, 
          title: 'Квиз-пятиминутка', 
          desc: '5 быстрых вопросов (Правда/Ложь)', 
          icon: 'timer', 
          color: 'amber',
          config: { type: 'boolean', count: 5, difficulty: 'easy' }
      },
      { 
          id: 3, 
          title: 'Итоговая контрольная', 
          desc: '20 вопросов со смешанным типом', 
          icon: 'school', 
          color: 'purple',
          config: { type: 'mcq', count: 20, difficulty: 'hard' }
      }
  ];

  return (
    <PageTransition>
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 pb-32 md:pb-8 h-full overflow-y-auto custom-scrollbar">
      <Confetti active={showConfetti} />
      <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
          accept="image/*,.pdf"
          multiple
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('dash.welcome')}, {currentUser.firstName}</h1>
          <p className="text-slate-400 mt-1">
             Активный курс: <span className="text-primary font-bold">{selectedCourse === '9A' ? 'Математика 9 «А»' : 'Геометрия 10 «Б»'}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleUploadClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95"
            >
            <span className="material-symbols-outlined">upload_file</span>
            {t('dash.upload')}
          </button>
          <button 
            className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-border text-white rounded-xl font-bold hover:bg-surface-lighter transition-all active:scale-95"
            onClick={() => navigate('/ocr')}
          >
            <span className="material-symbols-outlined">assignment_turned_in</span>
            {t('dash.check')}
          </button>
        </div>
      </div>

      {uploadQueue.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-4 animate-fade-in">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-white">{t('dash.queue')}</h3>
                  <button onClick={() => setUploadQueue([])} className="text-xs text-slate-400 hover:text-white">{t('dash.clear')}</button>
              </div>
              <div className="space-y-3">
                  {uploadQueue.map(item => (
                      <div key={item.id} className="space-y-1">
                          <div className="flex justify-between text-xs">
                              <span className="text-slate-300 truncate max-w-[200px]">{item.name}</span>
                              <span className={item.status === 'completed' ? 'text-green-400' : 'text-blue-400'}>
                                  {item.status === 'completed' ? 'Готово' : `${Math.round(item.progress)}%`}
                              </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
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
        <div className="lg:col-span-2 space-y-4 animate-slide-in-right" style={{animationDelay: '0.1s'}}>
            <h2 className="text-lg font-bold text-white">Галерея шаблонов</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {templates.map(tmpl => (
                    <div 
                        key={tmpl.id}
                        onClick={() => handleUseTemplate(tmpl.config)}
                        className="bg-surface border border-border p-4 rounded-xl cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
                    >
                        <div className={`size-10 rounded-lg bg-${tmpl.color}-500/20 text-${tmpl.color}-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                            <span className="material-symbols-outlined">{tmpl.icon}</span>
                        </div>
                        <h3 className="font-bold text-white text-sm mb-1">{tmpl.title}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{tmpl.desc}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between mt-8">
                <h2 className="text-lg font-bold text-white">{t('dash.needsReview')}</h2>
                <button className="text-xs font-bold text-primary uppercase tracking-wider hover:text-primary-hover">{t('dash.viewAll')}</button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {needsReview.length > 0 ? needsReview.map((item) => (
                <div 
                    key={item.id} 
                    onClick={() => handleNavigate('ocr', item.id)}
                    className="group bg-surface border border-border p-3 rounded-2xl hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-black/20"
                >
                    <div className="aspect-[4/5] rounded-xl bg-slate-800 mb-3 overflow-hidden relative">
                        <img src={item.img} alt={`Работа: ${item.subject}`} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <span className="material-symbols-outlined text-white text-3xl drop-shadow-lg">edit_document</span>
                        </div>
                    </div>
                    <h3 className="text-sm font-bold text-white truncate" title={item.name}>{item.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{item.subject}</p>
                </div>
                )) : (
                    <div className="col-span-4 p-8 text-center text-slate-500 bg-surface rounded-2xl border border-dashed border-border">
                        Нет работ для проверки
                    </div>
                )}
            </div>
        </div>

        <div className="space-y-4 animate-slide-in-right" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">{t('dash.performance')}</h2>
                <button className="material-symbols-outlined text-slate-500 hover:text-white">more_horiz</button>
            </div>
            
            <PerformanceChart 
                data={pieChart} 
                selectedCourse={selectedCourse} 
                title={t('dash.performance')} 
                avgLabel={t('dash.avgScore')} 
            />
        </div>
      </div>

      <div className="space-y-4 animate-slide-in-right" style={{animationDelay: '0.3s'}}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white">{t('dash.activity')}</h2>
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                        type="text" 
                        placeholder={t('dash.search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-all"
                    />
                </div>
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider whitespace-nowrap hidden sm:flex transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">download</span> {t('dash.export')}
                </button>
            </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm min-h-[200px]">
            {filteredActivity.length > 0 ? (
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-900/50 text-slate-400 text-[11px] uppercase font-bold tracking-wider border-b border-border">
                            <th className="px-6 py-4">Тип документа</th>
                            <th className="px-6 py-4">Источник</th>
                            <th className="px-6 py-4">Время</th>
                            <th className="px-6 py-4">Статус</th>
                            <th className="px-6 py-4 text-right">Действие</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredActivity.map((activity) => (
                            <tr 
                                key={activity.id} 
                                onClick={() => handleNavigate(activity.type, activity.id)}
                                className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-${activity.statusColor}-500/10 text-${activity.statusColor}-400`}>
                                            <span className="material-symbols-outlined text-lg">
                                                {activity.type === 'quiz' ? 'quiz' : activity.type === 'plan' ? 'menu_book' : 'auto_awesome'}
                                            </span>
                                        </div>
                                        <span className="font-bold text-white">{activity.title}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-400">{activity.source}</td>
                                <td className="px-6 py-4 text-slate-400">{activity.time}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full bg-${activity.statusColor}-500/10 text-${activity.statusColor}-400 border border-${activity.statusColor}-500/20 text-[10px] font-bold uppercase tracking-wider`}>
                                        {activity.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-primary font-bold hover:underline">{activity.action}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                    <p className="font-medium">По вашему запросу ничего не найдено</p>
                </div>
            )}
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default Dashboard;
