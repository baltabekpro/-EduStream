import React, { useState, useMemo, useEffect } from 'react';
import { AnalyticsService } from '../lib/api';
import { useCourse } from '../context/CourseContext';
import { AnalyticsData, AnalyticsTopic } from '../types';
import { PageTransition } from '../components/PageTransition';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/Toast';

const Analytics: React.FC = () => {
  const { selectedCourse } = useCourse();
  const { t } = useLanguage();
    const { addToast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Drill-down State
  const [selectedTopic, setSelectedTopic] = useState<AnalyticsTopic | null>(null);

  useEffect(() => {
    if (!selectedCourse) {
        setLoading(false);
        setData(null);
        return;
    }

    setLoading(true);
    // Uses Service Layer with Caching
    AnalyticsService.getPerformance(selectedCourse.id)
        .then(res => {
            setData(res || { students: [], topics: [] });
            setLoading(false);
        })
        .catch(err => {
            console.error('Analytics load error:', err);
            // Set empty data instead of null
            setData({ students: [], topics: [] });
            setLoading(false);
        });
  }, [selectedCourse]);

  // Optimization: Memoize computations for charts/lists
  const sortedStudents = useMemo(() => {
      if (!data || !Array.isArray(data.students)) return [];
      return [...data.students].sort((a, b) => b.progress - a.progress);
  }, [data]);

  const averageScore = useMemo(() => {
      if (!data || !Array.isArray(data.students) || data.students.length === 0) return 0;
      return (data.students.reduce((acc, s) => acc + s.progress, 0) / data.students.length).toFixed(1);
  }, [data]);

  const handleTopicClick = (topic: AnalyticsTopic) => {
      setSelectedTopic(topic);
  };

  const handleExportPDF = () => {
      addToast("Подготовка PDF...", "info");
      // Wait a bit for toast to show
      setTimeout(() => {
          window.print();
          addToast("Отчет готов к печати", "success");
      }, 500);
  };

  // Wait for course selection
  if (!selectedCourse) {
      return (
          <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                  <span className="material-symbols-outlined text-6xl mb-4">bar_chart</span>
                  <p>Выберите курс для просмотра аналитики</p>
              </div>
          </div>
      );
  }

  if (loading) {
      return (
          <div className="flex items-center justify-center h-full">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
          </div>
      );
  }

  if (!data || !data.students || data.students.length === 0) {
      return (
          <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                  <span className="material-symbols-outlined text-6xl mb-4">insights</span>
                  <p>Нет данных для отображения</p>
                  <p className="text-sm mt-2">Загрузите материалы и создайте тесты</p>
              </div>
          </div>
      );
  }

  // DRILL DOWN VIEW
  if (selectedTopic) {
      return (
          <PageTransition>
              <div className="p-8 h-full overflow-y-auto">
                  <button onClick={() => setSelectedTopic(null)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                      <span className="material-symbols-outlined">arrow_back</span> {t('analytics.back')}
                  </button>
                  <h2 className="text-3xl font-black text-white mb-2">{selectedTopic.name}</h2>
                  <div className="text-6xl font-black text-primary mb-8">{selectedTopic.score}%</div>
                  
                  <div className="bg-surface border border-border rounded-2xl p-6">
                      <h3 className="font-bold text-white mb-4">{t('analytics.breakdown')}</h3>
                      <div className="space-y-2">
                          {data.students.map(s => (
                              <div key={s.id} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg">
                                  <span className="text-slate-300 font-bold">{s.name}</span>
                                  <span className={`font-mono ${s.progress >= selectedTopic.score ? 'text-green-400' : 'text-red-400'}`}>
                                      {Math.round(s.progress)}%
                                  </span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </PageTransition>
      );
  }

  // DASHBOARD VIEW
    const regularStudents = sortedStudents.filter((s) => s.status.startsWith('Постоянный')).length;

  return (
    <PageTransition>
    <div className="h-full bg-background overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8 pb-32">
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-black text-white">{t('analytics.title')}</h2>
                <p className="text-slate-400">{t('analytics.subtitle')} <span className="text-white font-bold">{selectedCourse.title}</span></p>
            </div>
            <div className="flex items-end gap-4">
                <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95 print:hidden"
                >
                    <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                    Экспорт PDF
                </button>
                <div className="text-right">
                    <div className="text-4xl font-black text-white">{averageScore}%</div>
                    <div className="text-xs font-bold text-slate-500 uppercase">{t('analytics.average')}</div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase font-bold">Постоянные ученики</p>
                <p className="text-2xl font-black text-white mt-1">{regularStudents}</p>
                <p className="text-xs text-slate-500 mt-1">3+ выполненных теста в курсе</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase font-bold">Всего активных</p>
                <p className="text-2xl font-black text-white mt-1">{sortedStudents.length}</p>
                <p className="text-xs text-slate-500 mt-1">учеников с результатами</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-xs text-slate-400 uppercase font-bold">Как стать постоянным</p>
                <p className="text-sm text-slate-300 mt-1">Выполнять задания на сайте минимум 3 раза</p>
            </div>
        </div>

        {/* Heatmap Topics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.topics?.map((topic, idx) => (
                <div 
                    key={idx} 
                    onClick={() => handleTopicClick(topic)}
                    className={`bg-surface border border-border rounded-xl p-4 cursor-pointer hover:border-${topic.colorKey}-500/50 hover:bg-${topic.colorKey}-500/10 transition-all group`}
                >
                    <div className="flex justify-between items-start mb-2">
                         <span className={`material-symbols-outlined text-${topic.colorKey}-500 group-hover:scale-110 transition-transform`}>
                             {topic.score > 80 ? 'stars' : 'analytics'}
                         </span>
                         <span className="text-xl font-black text-white">{topic.score}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase truncate" title={topic.name}>{topic.name}</p>
                </div>
            ))}
        </div>

        {/* Optimized Student List */}
        <div className="bg-surface border border-border rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">{t('analytics.leaderboard')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedStudents.map((student, i) => (
                    <div key={student.id} className="flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-white/5 transition-colors">
                        <span className={`text-lg font-black w-6 text-center ${i < 3 ? 'text-yellow-400' : 'text-slate-600'}`}>
                            {i + 1}
                        </span>
                        <div 
                            className="size-10 rounded-full bg-cover bg-center bg-slate-700"
                            style={{ backgroundImage: `url('${student.avatar}')` }}
                        ></div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{student.name}</h4>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div className={`h-full bg-${student.color}-500`} style={{ width: `${student.progress}%` }}></div>
                            </div>
                        </div>
                        <span className="text-sm font-black text-slate-300">{student.progress}%</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
    </PageTransition>
  );
};

export default Analytics;