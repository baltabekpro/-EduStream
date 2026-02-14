import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import ShareModal from '../components/ShareModal';
import { AIService } from '../lib/api';
import { PageTransition } from '../components/PageTransition';
import type { Question, QuizPayload } from '../types';

const TeacherQuizPreview: React.FC = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!quizId) return;
      try {
        const data = await AIService.getQuizById(quizId);
        setQuiz(data);
        setQuizTitle(data.title || 'Тест');
        setQuestions(data.questions || []);
      } catch (error: any) {
        addToast(error.message || 'Не удалось загрузить тест', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [quizId]);

  const updateQuestion = (index: number, patch: Partial<Question>) => {
    setQuestions(prev => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const updateOption = (qIndex: number, optionIndex: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const options = [...(q.options || [])];
      options[optionIndex] = value;
      return { ...q, options };
    }));
  };

  const handleSave = async () => {
    if (!quizId) return;
    setIsSaving(true);
    try {
      const updated = await AIService.updateQuiz(quizId, questions, quizTitle);
      setQuiz(updated);
      setQuizTitle(updated.title || quizTitle);
      setQuestions(updated.questions || []);
      addToast('Изменения сохранены', 'success');
    } catch (error: any) {
      addToast(error.message || 'Не удалось сохранить изменения', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="h-full flex items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white">Предпросмотр теста</h1>
            <p className="text-slate-400 text-sm">Режим учителя: редактирование перед отправкой ученикам.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/ai')}
              className="px-4 py-2 bg-surface border border-border rounded-xl text-slate-300 hover:bg-white/5"
            >
              Назад в AI
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover disabled:opacity-60"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              disabled={!quiz?.id}
              className="px-4 py-2 bg-surface border border-border text-white rounded-xl font-bold hover:bg-white/5 disabled:opacity-60"
            >
              Поделиться
            </button>
            <button
              onClick={() => navigate(`/quiz-results?quizId=${quizId || ''}`)}
              className="px-4 py-2 bg-surface border border-border text-slate-300 rounded-xl font-bold hover:bg-white/5"
            >
              Результаты
            </button>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <label className="block text-xs font-bold text-slate-400 mb-2">Название теста</label>
          <input
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white"
            placeholder="Название теста"
          />
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id || idx} className="bg-surface border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 font-bold">{idx + 1}.</span>
                <input
                  value={q.text}
                  onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white"
                />
              </div>

              {q.type === 'mcq' && (
                <div className="space-y-2 ml-7">
                  {(q.options || []).map((opt, optIdx) => (
                    <div key={optIdx} className="grid grid-cols-[1fr_auto] gap-2">
                      <input
                        value={opt}
                        onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm"
                      />
                      <button
                        onClick={() => updateQuestion(idx, { correctAnswer: opt })}
                        className={`px-3 py-2 rounded-lg text-xs font-bold ${q.correctAnswer === opt ? 'bg-green-600 text-white' : 'bg-surface border border-border text-slate-300'}`}
                      >
                        Верный
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {q.type !== 'mcq' && (
                <input
                  value={q.correctAnswer}
                  onChange={(e) => updateQuestion(idx, { correctAnswer: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="Правильный ответ"
                />
              )}

              <textarea
                value={q.explanation || ''}
                onChange={(e) => updateQuestion(idx, { explanation: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-slate-300 text-sm min-h-20"
                placeholder="Пояснение для учителя"
              />
            </div>
          ))}
        </div>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        resourceType="quiz"
        resourceId={quiz?.id}
        resourceTitle={quizTitle || 'Тест'}
      />
    </PageTransition>
  );
};

export default TeacherQuizPreview;
