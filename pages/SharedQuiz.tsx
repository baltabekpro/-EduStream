import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShareService, ApiError } from '../lib/api';
import { PageTransition } from '../components/PageTransition';
import type { SharedQuizPayload, SharedQuizResult } from '../types';

const SharedQuiz: React.FC = () => {
  const { code } = useParams();

  const [quiz, setQuiz] = useState<SharedQuizPayload | null>(null);
  const [result, setResult] = useState<SharedQuizResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [studentName, setStudentName] = useState('');
  const [password, setPassword] = useState('');
  const [needPassword, setNeedPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async (pw?: string) => {
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      const data = await ShareService.getByCode(code, pw);
      setQuiz(data);
      setNeedPassword(false);
    } catch (e: any) {
      if (e instanceof ApiError && e.code === 401) {
        setNeedPassword(true);
        setError('Требуется пароль для доступа к тесту');
      } else {
        setError(e.message || 'Не удалось загрузить тест');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [code]);

  const progress = useMemo(() => {
    const total = quiz?.questions.length || 0;
    const filled = Object.values(answers).filter(Boolean).length;
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  }, [answers, quiz]);

  const submit = async () => {
    if (!code || !quiz) return;
    setSubmitting(true);
    setError('');
    try {
      const data = await ShareService.submit(code, studentName || 'Student', answers);
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Не удалось отправить ответы');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
        </div>
      </PageTransition>
    );
  }

  if (needPassword) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 space-y-4">
            <h1 className="text-xl font-black text-white">Тест защищён паролем</h1>
            <p className="text-slate-400 text-sm">Введите пароль, чтобы открыть тест.</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white"
            />
            <button
              onClick={() => load(password)}
              className="w-full bg-primary text-white rounded-xl py-3 font-bold hover:bg-primary-hover"
            >
              Открыть
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!quiz) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center text-slate-400 p-4">
          {error || 'Тест не найден'}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-white p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h1 className="text-2xl font-black">{quiz.title}</h1>
            <p className="text-slate-400 text-sm mt-1">Прогресс заполнения: {progress}%</p>
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Ваше имя"
              className="mt-4 w-full bg-background border border-border rounded-lg px-3 py-2 text-white"
            />
          </div>

          {!result ? (
            <>
              {quiz.questions.map((q, idx) => (
                <div key={q.id} className="bg-surface border border-border rounded-2xl p-5 space-y-3">
                  <p className="font-bold">{idx + 1}. {q.text}</p>

                  {q.type === 'mcq' ? (
                    <div className="space-y-2">
                      {q.options.map((opt, i) => (
                        <label key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={answers[q.id] === opt}
                            onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 min-h-20"
                      placeholder="Введите ответ"
                    />
                  )}
                </div>
              ))}

              <button
                onClick={submit}
                disabled={submitting}
                className="w-full bg-primary text-white rounded-xl py-3 font-bold hover:bg-primary-hover disabled:opacity-60"
              >
                {submitting ? 'Отправка...' : 'Отправить ответы'}
              </button>
            </>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-3">
              <div className="text-3xl font-black text-primary">{result.score}%</div>
              <p className="text-slate-300">Правильных ответов: {result.correct} из {result.total}</p>
              <p className="text-slate-400 text-sm">Результат отправлен учителю.</p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      </div>
    </PageTransition>
  );
};

export default SharedQuiz;
