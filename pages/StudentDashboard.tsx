import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { formatDate, formatNumber } from '../lib/localeFormatting';
import { getStudentProgressHistory, type StudentProgressEntry } from '../lib/studentProgress';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { t, language } = useLanguage();
  const [progressHistory, setProgressHistory] = useState<StudentProgressEntry[]>(() => getStudentProgressHistory());

  useEffect(() => {
    const refreshHistory = () => setProgressHistory(getStudentProgressHistory());

    refreshHistory();
    window.addEventListener('storage', refreshHistory);
    window.addEventListener('focus', refreshHistory);

    return () => {
      window.removeEventListener('storage', refreshHistory);
      window.removeEventListener('focus', refreshHistory);
    };
  }, []);

  const studentHistory = useMemo(() => {
    const normalizedName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim().toLowerCase();
    if (!normalizedName) return progressHistory;

    return progressHistory.filter((item) => item.studentName.trim().toLowerCase() === normalizedName);
  }, [progressHistory, user?.firstName, user?.lastName]);

  const stats = useMemo(() => {
    const attempts = studentHistory.length;
    const scoredAttempts = studentHistory.filter((item) => typeof item.score === 'number');
    const averageScore = scoredAttempts.length
      ? scoredAttempts.reduce((sum, item) => sum + Number(item.score || 0), 0) / scoredAttempts.length
      : 0;
    const bestScore = scoredAttempts.length
      ? Math.max(...scoredAttempts.map((item) => Number(item.score || 0)))
      : 0;
    const inReview = studentHistory.filter((item) => item.status !== 'graded' && item.status !== 'reviewed').length;

    return { attempts, averageScore, bestScore, inReview };
  }, [studentHistory]);

  const recentHistory = useMemo(() => {
    return [...studentHistory]
      .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt))
      .slice(0, 5);
  }, [studentHistory]);

  const progressPercent = useMemo(() => {
    if (!studentHistory.length) return 0;
    return Math.min(100, Math.round(stats.averageScore));
  }, [stats.averageScore, studentHistory.length]);

  return (
    <PageTransition>
      <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
        <div className="flex flex-col gap-2 max-w-5xl">
          <h1 className="text-3xl font-black text-white">{t('student.dashboard.greeting')}, {user?.firstName || t('student.dashboard.student')}</h1>
          <p className="text-slate-400">{t('student.dashboard.selectSection')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 max-w-6xl">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface border border-border rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wider text-slate-400">{t('student.progress.attempts')}</p>
                <p className="text-3xl font-black text-white mt-2">{formatNumber(stats.attempts, language)}</p>
                <p className="text-xs text-slate-500 mt-2">{t('student.progress.completed')}</p>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wider text-slate-400">{t('student.progress.averageScore')}</p>
                <p className="text-3xl font-black text-white mt-2">{formatNumber(Math.round(stats.averageScore), language)}%</p>
                <p className="text-xs text-slate-500 mt-2">{t('student.progress.inReview')}: {formatNumber(stats.inReview, language)}</p>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wider text-slate-400">{t('student.progress.bestScore')}</p>
                <p className="text-3xl font-black text-white mt-2">{formatNumber(Math.round(stats.bestScore), language)}%</p>
                <p className="text-xs text-slate-500 mt-2">{t('student.dashboard.myTests')}</p>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-5">
                <p className="text-xs uppercase tracking-wider text-slate-400">{t('student.progress.recentActivity')}</p>
                <p className="text-3xl font-black text-white mt-2">{formatNumber(recentHistory.length, language)}</p>
                <p className="text-xs text-slate-500 mt-2">{t('student.dashboard.myAssignments')}</p>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">{t('student.dashboard.myProgress')}</h2>
                  <p className="text-sm text-slate-400 mt-1">{t('student.dashboard.progressDesc')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wider text-slate-500">{t('student.progress.averageScore')}</p>
                  <p className="text-xl font-black text-white">{formatNumber(Math.round(stats.averageScore), language)}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{t('student.progress.completed')}</span>
                  <span>{formatNumber(progressPercent, language)}%</span>
                </div>
                <div className="h-2 rounded-full bg-background border border-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {recentHistory.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background/60 p-5 text-sm text-slate-400">
                  {t('student.progress.noActivity')}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentHistory.map((item) => (
                    <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                            {item.type === 'quiz' ? t('student.progress.quiz') : t('student.progress.assignment')}
                          </span>
                          <span className="text-sm font-bold text-white truncate">{item.title}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.code} • {formatDate(item.submittedAt, language)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${item.status === 'submitted' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-green-500/30 bg-green-500/10 text-green-300'}`}>
                          {item.status === 'submitted' ? t('student.progress.submitted') : t('student.progress.graded')}
                        </span>
                        <span className="min-w-[64px] text-right text-sm font-black text-white">
                          {item.score === null ? '—' : `${formatNumber(Math.round(item.score), language)}%`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate('/student-progress')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-slate-300 hover:text-white hover:border-primary/60 text-sm font-bold"
              >
                <span className="material-symbols-outlined text-base">trending_up</span>
                {t('student.progress.openDetailed')}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-5 md:p-6">
              <h2 className="text-lg font-bold text-white mb-2">{t('student.dashboard.myAssignments')}</h2>
              <p className="text-sm text-slate-300 mb-4">{t('student.dashboard.myAssignmentsDesc')}</p>
              <button
                type="button"
                onClick={() => navigate('/student-assignments')}
                className="px-3 py-2 rounded-lg border border-border bg-background text-slate-300 hover:text-white hover:border-primary/60 text-sm font-bold"
              >
                {t('student.dashboard.openAssignments')}
              </button>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 md:p-6">
              <h2 className="text-lg font-bold text-white mb-2">{t('student.dashboard.myTests')}</h2>
              <p className="text-sm text-slate-300 mb-4">{t('student.dashboard.myTestsDesc')}</p>
              <button
                type="button"
                onClick={() => navigate('/student-tests')}
                className="px-3 py-2 rounded-lg border border-border bg-background text-slate-300 hover:text-white hover:border-primary/60 text-sm font-bold"
              >
                {t('student.dashboard.openTests')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default StudentDashboard;
