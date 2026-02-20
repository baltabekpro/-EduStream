import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { AnalyticsService, ShareService } from '../lib/api';
import { useToast } from '../components/Toast';
import { useCourse } from '../context/CourseContext';
import type { StudentJournalItem, TeacherQuizResult } from '../types';

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

type ViewMode = 'results' | 'journal';

const QuizResults: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { selectedCourse } = useCourse();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuizId = searchParams.get('quizId') || '';
  const [quizIdFilter, setQuizIdFilter] = useState(initialQuizId);
  const [viewMode, setViewMode] = useState<ViewMode>('results');

  const [results, setResults] = useState<TeacherQuizResult[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(true);

  const [journalItems, setJournalItems] = useState<StudentJournalItem[]>([]);
  const [journalStats, setJournalStats] = useState({ totalStudents: 0, regularStudents: 0, averageScore: 0 });
  const [isLoadingJournal, setIsLoadingJournal] = useState(true);

  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [savingCommentKey, setSavingCommentKey] = useState<string | null>(null);

  const loadResults = async (quizId?: string) => {
    if (!selectedCourse) {
      setResults([]);
      setIsLoadingResults(false);
      return;
    }

    setIsLoadingResults(true);
    try {
      const data = await ShareService.getTeacherResults(quizId, selectedCourse.id);
      setResults(data);
    } catch (error: any) {
      addToast(error.message || 'Не удалось загрузить результаты', 'error');
    } finally {
      setIsLoadingResults(false);
    }
  };

  const loadJournal = async () => {
    if (!selectedCourse) {
      setJournalItems([]);
      setJournalStats({ totalStudents: 0, regularStudents: 0, averageScore: 0 });
      setIsLoadingJournal(false);
      return;
    }

    setIsLoadingJournal(true);
    try {
      const data = await AnalyticsService.getStudentJournal(selectedCourse.id);
      setJournalItems(data.students || []);
      setJournalStats({
        totalStudents: data.totalStudents || 0,
        regularStudents: data.regularStudents || 0,
        averageScore: data.averageScore || 0,
      });

      const nextDrafts: Record<string, string> = {};
      (data.students || []).forEach((item) => {
        nextDrafts[item.studentKey] = item.teacherComment || '';
      });
      setCommentDrafts(nextDrafts);
    } catch (error: any) {
      if (!(error?.code === 404)) {
        addToast(error.message || 'Не удалось загрузить дневник учеников', 'error');
      }
    } finally {
      setIsLoadingJournal(false);
    }
  };

  useEffect(() => {
    setQuizIdFilter(initialQuizId);
    loadResults(initialQuizId || undefined);
    loadJournal();
  }, [selectedCourse?.id]);

  const averageScore = useMemo(() => {
    if (!results.length) return 0;
    return Math.round(results.reduce((acc, item) => acc + item.score, 0) / results.length);
  }, [results]);

  const applyFilter = () => {
    const normalized = quizIdFilter.trim();
    if (normalized) {
      setSearchParams({ quizId: normalized });
      loadResults(normalized);
    } else {
      setSearchParams({});
      loadResults();
    }
  };

  const saveComment = async (item: StudentJournalItem) => {
    if (!selectedCourse) return;

    const draft = (commentDrafts[item.studentKey] || '').trim();
    setSavingCommentKey(item.studentKey);
    try {
      await AnalyticsService.saveStudentComment(selectedCourse.id, item.studentName, draft);
      addToast('Комментарий сохранён', 'success');
      setJournalItems((prev) => prev.map((entry) => (
        entry.studentKey === item.studentKey
          ? { ...entry, teacherComment: draft }
          : entry
      )));
    } catch (error: any) {
      addToast(error.message || 'Не удалось сохранить комментарий', 'error');
    } finally {
      setSavingCommentKey(null);
    }
  };

  return (
    <PageTransition>
      <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white">Результаты и дневник</h1>
            <p className="text-slate-400 text-sm">Курс: {selectedCourse?.title || 'не выбран'}</p>
          </div>
          <button
            onClick={() => navigate('/ai')}
            className="px-4 py-2 bg-surface border border-border rounded-xl text-slate-300 hover:bg-white/5"
          >
            Назад в AI
          </button>
        </div>

        <div className="inline-flex bg-surface border border-border rounded-xl p-1">
          <button
            onClick={() => setViewMode('results')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${viewMode === 'results' ? 'bg-primary text-white' : 'text-slate-300 hover:text-white'}`}
          >
            Результаты
          </button>
          <button
            onClick={() => setViewMode('journal')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${viewMode === 'journal' ? 'bg-primary text-white' : 'text-slate-300 hover:text-white'}`}
          >
            Дневник
          </button>
        </div>

        {!selectedCourse ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center text-slate-400">
            Сначала выберите курс в левом меню
          </div>
        ) : viewMode === 'results' ? (
          <>
            <div className="bg-surface border border-border rounded-2xl p-4 md:p-5 grid md:grid-cols-[1fr_auto] gap-3">
              <input
                value={quizIdFilter}
                onChange={(e) => setQuizIdFilter(e.target.value)}
                placeholder="Фильтр по quizId (опционально)"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white"
              />
              <button
                onClick={applyFilter}
                className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover"
              >
                Применить
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-slate-400 text-xs">Всего попыток</p>
                <p className="text-2xl font-black text-white mt-1">{results.length}</p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-slate-400 text-xs">Средний балл</p>
                <p className="text-2xl font-black text-white mt-1">{averageScore}%</p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-slate-400 text-xs">Текущий фильтр</p>
                <p className="text-sm font-bold text-white mt-2 break-all">{quizIdFilter || 'Все тесты'}</p>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="grid grid-cols-[1.3fr_1.2fr_0.6fr_1fr] gap-3 px-4 py-3 text-xs font-bold text-slate-400 border-b border-border bg-background/30">
                <div>Ученик</div>
                <div>Тест</div>
                <div>Балл</div>
                <div>Дата</div>
              </div>

              {isLoadingResults ? (
                <div className="p-8 text-center text-slate-400">Загрузка...</div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Пока нет отправленных результатов</div>
              ) : (
                results.map((item) => (
                  <div
                    key={item.resultId}
                    className="grid grid-cols-[1.3fr_1.2fr_0.6fr_1fr] gap-3 px-4 py-3 border-b border-border/60 last:border-b-0 text-sm"
                  >
                    <div className="text-white font-medium">{item.studentName}</div>
                    <div className="text-slate-300 truncate" title={`${item.materialTitle} (${item.quizId})`}>
                      {item.materialTitle}
                    </div>
                    <div className={`font-bold ${item.score >= 70 ? 'text-green-400' : item.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {item.score}%
                    </div>
                    <div className="text-slate-400">{formatDate(item.submittedAt)}</div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-slate-400 text-xs">Учеников в дневнике</p>
                <p className="text-2xl font-black text-white mt-1">{journalStats.totalStudents}</p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-slate-400 text-xs">Постоянные ученики</p>
                <p className="text-2xl font-black text-white mt-1">{journalStats.regularStudents}</p>
                <p className="text-[11px] text-slate-500">3+ попытки в курсе</p>
              </div>
              <div className="bg-surface border border-border rounded-xl p-4">
                <p className="text-slate-400 text-xs">Средний балл курса</p>
                <p className="text-2xl font-black text-white mt-1">{Math.round(journalStats.averageScore)}%</p>
              </div>
            </div>

            <div className="space-y-4">
              {isLoadingJournal ? (
                <div className="bg-surface border border-border rounded-2xl p-8 text-center text-slate-400">Загрузка дневника...</div>
              ) : journalItems.length === 0 ? (
                <div className="bg-surface border border-border rounded-2xl p-8 text-center text-slate-400">Нет данных для дневника</div>
              ) : (
                journalItems.map((item) => (
                  <div key={item.studentKey} className="bg-surface border border-border rounded-2xl p-4 md:p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-white">{item.studentName}</p>
                          {item.regular && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/15 text-primary border border-primary/30">
                              Постоянный
                            </span>
                          )}
                          <span className={`material-symbols-outlined text-base ${item.trend === 'up' ? 'text-green-400' : item.trend === 'down' ? 'text-red-400' : 'text-slate-500'}`}>
                            {item.trend === 'up' ? 'trending_up' : item.trend === 'down' ? 'trending_down' : 'trending_flat'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Попыток: {item.attempts} • Средний: {Math.round(item.averageScore)}% • Последний: {item.lastScore}%
                        </p>
                      </div>
                    </div>

                    {item.weakTopics?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {item.weakTopics.map((topic) => (
                          <span key={topic} className="px-2 py-1 rounded-lg text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
                      <div className="bg-background/40 border border-border/70 rounded-xl p-3">
                        <p className="text-xs font-bold uppercase text-slate-400 mb-3">История попыток</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                          {item.history.map((attempt) => (
                            <div key={attempt.resultId} className="flex items-center justify-between gap-3 bg-surface/40 rounded-lg p-2 text-xs">
                              <div className="min-w-0">
                                <p className="text-white truncate flex items-center gap-2" title={`${attempt.quizTitle} • ${attempt.materialTitle}`}>
                                  <span>{attempt.quizTitle}</span>
                                  {attempt.resultType === 'assignment' && (
                                    <span className={`px-1.5 py-0.5 rounded border text-[10px] ${attempt.status === 'graded' || attempt.status === 'reviewed' ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-amber-300 border-amber-500/30 bg-amber-500/10'}`}>
                                      {attempt.status === 'graded' || attempt.status === 'reviewed' ? 'проверено' : 'на проверке'}
                                    </span>
                                  )}
                                </p>
                                <p className="text-slate-400">{formatDate(attempt.submittedAt)}</p>
                              </div>
                              <span className={`font-bold ${attempt.hasScore === false ? 'text-slate-500' : attempt.score >= 70 ? 'text-green-400' : attempt.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {attempt.hasScore === false ? '—' : `${attempt.score}%`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-background/40 border border-border/70 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-bold uppercase text-slate-400">Комментарий учителя</p>
                        <textarea
                          value={commentDrafts[item.studentKey] ?? ''}
                          onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [item.studentKey]: e.target.value }))}
                          placeholder="Напишите рекомендации ученику..."
                          className="w-full min-h-[120px] bg-background border border-border rounded-lg px-3 py-2 text-sm text-white"
                        />
                        <button
                          onClick={() => saveComment(item)}
                          disabled={savingCommentKey === item.studentKey}
                          className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-hover disabled:opacity-60"
                        >
                          {savingCommentKey === item.studentKey ? 'Сохранение...' : 'Сохранить комментарий'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default QuizResults;
