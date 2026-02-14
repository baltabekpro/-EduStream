import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { ShareService } from '../lib/api';
import { useToast } from '../components/Toast';
import type { TeacherQuizResult } from '../types';

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const QuizResults: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuizId = searchParams.get('quizId') || '';
  const [quizIdFilter, setQuizIdFilter] = useState(initialQuizId);
  const [results, setResults] = useState<TeacherQuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadResults = async (quizId?: string) => {
    setIsLoading(true);
    try {
      const data = await ShareService.getTeacherResults(quizId);
      setResults(data);
    } catch (error: any) {
      addToast(error.message || 'Не удалось загрузить результаты тестов', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResults(initialQuizId || undefined);
  }, []);

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

  return (
    <PageTransition>
      <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white">Результаты тестов</h1>
            <p className="text-slate-400 text-sm">Все отправленные попытки учеников по вашим тестам.</p>
          </div>
          <button
            onClick={() => navigate('/ai')}
            className="px-4 py-2 bg-surface border border-border rounded-xl text-slate-300 hover:bg-white/5"
          >
            Назад в AI
          </button>
        </div>

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

          {isLoading ? (
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
      </div>
    </PageTransition>
  );
};

export default QuizResults;
