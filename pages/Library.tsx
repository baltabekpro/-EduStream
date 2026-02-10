import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { useToast } from '../components/Toast';
import { deleteSavedQuiz, listSavedQuizzes, type SavedQuiz } from '../lib/quizLibrary';

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const Library: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [items, setItems] = useState<SavedQuiz[]>([]);

  const refresh = () => setItems(listSavedQuizzes());

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('quizLibraryUpdated', handler as EventListener);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('quizLibraryUpdated', handler as EventListener);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const hasItems = useMemo(() => items.length > 0, [items.length]);

  return (
    <PageTransition>
      <div className="h-full w-full overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Библиотека тестов</h1>
              <p className="text-slate-400 mt-1 text-sm">
                Здесь хранятся тесты, которые вы сохранили из AI ассистента.
              </p>
            </div>
            <button
              onClick={() => navigate('/ai')}
              className="px-4 py-2 bg-surface border border-border rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-sm font-bold"
            >
              Вернуться в AI
            </button>
          </div>

          {!hasItems ? (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center">
              <div className="mx-auto size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <span className="material-symbols-outlined text-3xl">library_books</span>
              </div>
              <p className="text-white font-bold">Пока пусто</p>
              <p className="text-slate-400 text-sm mt-1">
                Сгенерируйте тест в AI ассистенте и нажмите «Сохранить в библиотеку».
              </p>
              <button
                onClick={() => navigate('/ai')}
                className="mt-5 px-5 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-colors"
              >
                Перейти в AI ассистент
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((q) => (
                <div
                  key={q.id}
                  className="bg-surface border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">quiz</span>
                      <p className="text-white font-bold truncate">{q.materialTitle || 'Тест'}</p>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">
                      {q.questions?.length || 0} вопросов • {formatDate(q.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/ai', { state: { docId: q.materialId, savedQuizId: q.id } })}
                      className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-colors text-sm"
                    >
                      Открыть
                    </button>
                    <button
                      onClick={() => {
                        deleteSavedQuiz(q.id);
                        addToast('Тест удалён из библиотеки', 'success');
                      }}
                      className="px-4 py-2 bg-surface border border-border text-slate-300 rounded-xl font-bold hover:bg-white/5 hover:text-white transition-colors text-sm"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Library;
