import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';
import { formatDate, formatNumber } from '../lib/localeFormatting';
import { getStudentProgressHistory, type StudentProgressEntry, type StudentProgressType } from '../lib/studentProgress';

type ProgressFilter = 'all' | StudentProgressType;

const ProgressStatCard: React.FC<{ label: string; value: string; hint: string }> = ({ label, value, hint }) => (
  <div className="bg-surface border border-border rounded-2xl p-5">
    <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
    <p className="text-3xl font-black text-white mt-2">{value}</p>
    <p className="text-xs text-slate-500 mt-2">{hint}</p>
  </div>
);

const StudentProgress: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { t, language } = useLanguage();
  const [progressHistory, setProgressHistory] = useState<StudentProgressEntry[]>(() => getStudentProgressHistory());
  const [filter, setFilter] = useState<ProgressFilter>('all');

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

  const filteredHistory = useMemo(() => {
    if (filter === 'all') return studentHistory;
    return studentHistory.filter((item) => item.type === filter);
  }, [filter, studentHistory]);

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
    const completed = studentHistory.filter((item) => item.status === 'graded' || item.status === 'reviewed').length;
    const quizCount = studentHistory.filter((item) => item.type === 'quiz').length;
    const assignmentCount = studentHistory.filter((item) => item.type === 'assignment').length;

    return { attempts, averageScore, bestScore, inReview, completed, quizCount, assignmentCount };
  }, [studentHistory]);

  const progressPercent = useMemo(() => {
    if (!studentHistory.length) return 0;
    return Math.min(100, Math.round(stats.averageScore));
  }, [stats.averageScore, studentHistory.length]);

  const quizAttempts = useMemo(() => studentHistory.filter((item) => item.type === 'quiz'), [studentHistory]);
  const assignmentAttempts = useMemo(() => studentHistory.filter((item) => item.type === 'assignment'), [studentHistory]);

  const quizAverage = useMemo(() => {
    const scored = quizAttempts.filter((item) => typeof item.score === 'number');
    return scored.length ? scored.reduce((sum, item) => sum + Number(item.score || 0), 0) / scored.length : 0;
  }, [quizAttempts]);

  const assignmentAverage = useMemo(() => {
    const scored = assignmentAttempts.filter((item) => typeof item.score === 'number');
    return scored.length ? scored.reduce((sum, item) => sum + Number(item.score || 0), 0) / scored.length : 0;
  }, [assignmentAttempts]);

  return (
    <PageTransition>
      <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6 pb-28">
        <div className="flex flex-col gap-3 max-w-6xl">
          <button
            type="button"
            onClick={() => navigate('/student')}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors w-fit"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            {t('nav.myDashboard')}
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white">{t('student.progress.pageTitle')}</h1>
            <p className="text-slate-400 mt-2 max-w-3xl">{t('student.progress.pageSubtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 max-w-6xl">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <ProgressStatCard label={t('student.progress.attempts')} value={formatNumber(stats.attempts, language)} hint={t('student.progress.completedAttempts')} />
              <ProgressStatCard label={t('student.progress.averageScore')} value={`${formatNumber(Math.round(stats.averageScore), language)}%`} hint={t('student.progress.scoreLabel')} />
              <ProgressStatCard label={t('student.progress.bestScore')} value={`${formatNumber(Math.round(stats.bestScore), language)}%`} hint={t('student.progress.completed')} />
              <ProgressStatCard label={t('student.progress.inReview')} value={formatNumber(stats.inReview, language)} hint={t('student.progress.statusSubmitted')} />
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">{t('student.progress.summary')}</h2>
                  <p className="text-sm text-slate-400 mt-1">{t('student.progress.filterHint')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {([
                    ['all', t('student.progress.all')],
                    ['quiz', t('student.progress.quizOnly')],
                    ['assignment', t('student.progress.assignmentOnly')],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFilter(value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${filter === value ? 'bg-primary text-white' : 'bg-background border border-border text-slate-300 hover:text-white hover:border-primary/60'}`}
                    >
                      {label}
                    </button>
                  ))}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">{t('student.progress.completedCount')}</p>
                  <p className="mt-2 text-2xl font-black text-white">{formatNumber(stats.completed, language)}</p>
                </div>
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">{t('student.progress.quizCount')}</p>
                  <p className="mt-2 text-2xl font-black text-white">{formatNumber(stats.quizCount, language)}</p>
                  <p className="mt-2 text-xs text-slate-500">{formatNumber(Math.round(quizAverage), language)}%</p>
                </div>
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">{t('student.progress.assignmentCount')}</p>
                  <p className="mt-2 text-2xl font-black text-white">{formatNumber(stats.assignmentCount, language)}</p>
                  <p className="mt-2 text-xs text-slate-500">{formatNumber(Math.round(assignmentAverage), language)}%</p>
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background/60 p-5 text-sm text-slate-400">
                  {t('student.progress.emptyTitle')}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((item) => (
                    <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background/60 p-4 lg:flex-row lg:items-center lg:justify-between">
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

                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${item.status === 'submitted' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-green-500/30 bg-green-500/10 text-green-300'}`}>
                          {item.status === 'submitted' ? t('student.progress.statusSubmitted') : t('student.progress.statusReviewed')}
                        </span>
                        <span className="min-w-[72px] text-right text-sm font-black text-white">
                          {item.score === null ? '—' : `${formatNumber(Math.round(item.score), language)}%`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">{t('student.progress.typeBreakdown')}</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
                    <span>{t('student.progress.quizOnly')}</span>
                    <span>{formatNumber(Math.round(quizAverage), language)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-background border border-border overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-primary" style={{ width: `${Math.min(100, Math.round(quizAverage))}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
                    <span>{t('student.progress.assignmentOnly')}</span>
                    <span>{formatNumber(Math.round(assignmentAverage), language)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-background border border-border overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-300" style={{ width: `${Math.min(100, Math.round(assignmentAverage))}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 md:p-6">
              <h2 className="text-lg font-bold text-white mb-2">{t('student.progress.timeline')}</h2>
              <p className="text-sm text-slate-300 mb-4">{studentHistory.length ? t('student.progress.pageSubtitle') : t('student.progress.emptyDesc')}</p>
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

export default StudentProgress;