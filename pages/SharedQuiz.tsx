import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShareService, ApiError } from '../lib/api';
import { PageTransition } from '../components/PageTransition';
import type { SharedQuizPayload, SharedQuizResult } from '../types';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';

const QUESTION_TIME = 20;
const MAX_ASSIGNMENT_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_ASSIGNMENT_EXTENSIONS = ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'bmp', 'tif', 'tiff', 'webp'];
const STUDENT_NAME_STORAGE_KEY = 'studentDisplayName';
const SHARE_CODE_PATTERN = /^[A-Za-z0-9_-]{6,32}$/;

const escapeHtml = (raw: string) => raw
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const renderAssignmentHtml = (raw: string) => {
  const escaped = escapeHtml(raw || '').replace(/\r\n/g, '\n');
  let html = escaped
    .replace(/^###\s+(.+)$/gm, '<h3 class="text-base font-bold text-white mt-3 mb-1">$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2 class="text-lg font-bold text-white mt-3 mb-1">$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1 class="text-xl font-black text-white mt-3 mb-1">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^-\s+(.+)$/gm, '<li>$1</li>');

  html = html.replace(/(<li>.*<\/li>)(?!\n<li>)/gms, '<ul class="list-disc pl-5 space-y-1 my-2 text-slate-200">$1</ul>');
  html = html.replace(/\n/g, '<br/>');
  return html;
};

const SharedQuiz: React.FC = () => {
  const { code } = useParams();
  const { user } = useUser();
  const { t } = useLanguage();
  const normalizedCode = (code ? decodeURIComponent(code).trim() : '');

  const [quiz, setQuiz] = useState<SharedQuizPayload | null>(null);
  const [result, setResult] = useState<SharedQuizResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [studentName, setStudentName] = useState(() => localStorage.getItem(STUDENT_NAME_STORAGE_KEY) || '');
  const [password, setPassword] = useState('');
  const [needPassword, setNeedPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [assignmentText, setAssignmentText] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showReveal, setShowReveal] = useState(false);
  const [answerAccepted, setAnswerAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    const profileName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    if (profileName) {
      setStudentName(profileName);
      localStorage.setItem(STUDENT_NAME_STORAGE_KEY, profileName);
    }
  }, [user?.firstName, user?.lastName]);

  const load = async (pw?: string) => {
    if (!code) return;
    if (!SHARE_CODE_PATTERN.test(normalizedCode)) {
      setQuiz(null);
      setNeedPassword(false);
      setLoading(false);
      setError(t('shared.invalidCodeFormat'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await ShareService.getByCode(normalizedCode, pw);
      setQuiz(data);
      localStorage.setItem('lastOpenedShareCode', normalizedCode);
      setNeedPassword(false);
      setResult(null);
      setAnswers({});
      setCurrentIndex(0);
      setTimeLeft(QUESTION_TIME);
      setPoints(0);
      setStreak(0);
      setShowReveal(false);
      setAnswerAccepted(null);
    } catch (e: any) {
      if (e instanceof ApiError && e.code === 401) {
        setNeedPassword(true);
        setError(t('shared.passwordRequired'));
      } else {
        setError(e.message || t('shared.failedToLoadTest'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [code]);

  const totalQuestions = quiz?.questions?.length || 0;
  const currentQuestion = quiz?.questions?.[currentIndex] || null;

  const handleTimeExpired = () => {
    if (!currentQuestion || showReveal || result) return;
    if (!answers[currentQuestion.id]) {
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: '' }));
      setStreak(0);
      setAnswerAccepted(false);
      setShowReveal(true);
    }
  };

  useEffect(() => {
    if (!quiz || result || showReveal || !currentQuestion) return;
    if (timeLeft <= 0) {
      handleTimeExpired();
      return;
    }
    const timerId = window.setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => window.clearTimeout(timerId);
  }, [quiz, result, showReveal, currentQuestion?.id, timeLeft]);

  const submit = async () => {
    if (!normalizedCode || !quiz) return;
    if (!studentName.trim()) {
      setError(t('shared.enterNameBeforeSubmit'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const data = await ShareService.submit(normalizedCode, studentName.trim(), answers);
      setResult(data);
    } catch (e: any) {
      setError(e.message || t('shared.failedToSubmitAnswers'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitAssignment = async () => {
    if (!normalizedCode) {
      return;
    }
    if (!assignmentFile && !assignmentText.trim()) {
      setError(t('shared.addFileOrText'));
      return;
    }
    const profileName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    const effectiveStudentName = profileName || studentName.trim() || t('shared.student');
    setSubmitting(true);
    setError('');
    setUploadMessage('');
    try {
      const data = await ShareService.uploadAssignment(normalizedCode, effectiveStudentName, assignmentFile, assignmentText);
      setUploadMessage(data.message || t('shared.answerSentSuccessfully'));
      setAssignmentFile(null);
      setAssignmentText('');
    } catch (e: any) {
      setError(e.message || t('shared.failedToSendAnswer'));
    } finally {
      setSubmitting(false);
    }
  };

  const onAssignmentFileChange = (selected: File | null) => {
    if (!selected) {
      setAssignmentFile(null);
      return;
    }

    const extension = selected.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_ASSIGNMENT_EXTENSIONS.includes(extension)) {
      setError(t('shared.unsupportedFileType'));
      setAssignmentFile(null);
      return;
    }

    if (selected.size > MAX_ASSIGNMENT_FILE_SIZE) {
      setError(t('shared.fileTooLarge'));
      setAssignmentFile(null);
      return;
    }

    setError('');
    setAssignmentFile(selected);
  };

  const evaluateAndReveal = (questionId: string, selectedAnswer: string) => {
    if (!quiz || showReveal) return;

    const isAnswered = selectedAnswer.trim().length > 0;
    setAnswers((prev) => ({ ...prev, [questionId]: selectedAnswer }));

    if (isAnswered) {
      const earned = Math.max(100, timeLeft * 50);
      setPoints((prev) => prev + earned);
      setStreak((prev) => prev + 1);
      setAnswerAccepted(true);
    } else {
      setStreak(0);
      setAnswerAccepted(false);
    }

    setShowReveal(true);
  };

  const goToNextQuestion = () => {
    setShowReveal(false);
    setAnswerAccepted(null);

    if (!quiz?.questions) return;
    if (currentIndex >= quiz.questions.length - 1) {
      submit();
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setTimeLeft(QUESTION_TIME);
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

  if (quiz.resourceType === 'material') {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background text-white p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
              <h1 className="text-2xl font-black">{quiz.title}</h1>
              <p className="text-slate-400 text-sm">Выполните задание и загрузите документ для проверки учителем.</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-background border border-border text-slate-300">1. Добавьте текст и/или файл</span>
                <span className="px-2 py-1 rounded-full bg-background border border-border text-slate-300">2. Отправьте ответ</span>
                <span className="px-2 py-1 rounded-full bg-background border border-border text-slate-300">Имя подставится автоматически</span>
              </div>
              {quiz.description && (
                <div
                  className="bg-background border border-border rounded-lg p-3 text-sm text-slate-300"
                  dangerouslySetInnerHTML={{ __html: renderAssignmentHtml(quiz.description) }}
                >
                </div>
              )}
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="w-full bg-background border border-border rounded-lg px-3 py-2 text-slate-300 text-sm">
                {t('shared.student')}: {( `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || studentName || t('shared.student'))}
              </div>
              <textarea
                value={assignmentText}
                onChange={(e) => setAssignmentText(e.target.value)}
                placeholder="Текстовый ответ (опционально)"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white min-h-28"
              />
              <input
                type="file"
                onChange={(e) => onAssignmentFileChange(e.target.files?.[0] || null)}
                accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.bmp,.tif,.tiff,.webp"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white"
              />
              <p className="text-xs text-slate-400">Поддерживаются: PDF, DOCX, TXT и фото (PNG/JPG/BMP/TIFF/WEBP), до 10MB.</p>
              {assignmentFile && (
                <p className="text-xs text-slate-400">Выбран файл: {assignmentFile.name}</p>
              )}
              <button
                type="button"
                onClick={submitAssignment}
                disabled={submitting || (!assignmentFile && !assignmentText.trim())}
                className="w-full bg-primary text-white rounded-xl py-3 font-bold hover:bg-primary-hover disabled:opacity-60"
              >
                {submitting ? 'Отправка...' : 'Отправить ответ'}
              </button>
              {uploadMessage && <p className="text-green-400 text-sm">{uploadMessage}</p>}
              {uploadMessage && <p className="text-xs text-slate-400">При необходимости вы можете дополнить ответ и отправить повторно.</p>}
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          </div>
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
            <p className="text-slate-400 text-sm mt-1">Режим в стиле Kahoot: таймер, серия и очки</p>
            <input
              value={studentName}
              onChange={(e) => {
                const value = e.target.value;
                setStudentName(value);
                localStorage.setItem(STUDENT_NAME_STORAGE_KEY, value);
              }}
              placeholder="Ваше имя"
              className="mt-4 w-full bg-background border border-border rounded-lg px-3 py-2 text-white"
            />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="bg-background border border-border rounded-lg p-2">
                <p className="text-[10px] uppercase text-slate-500">Прогресс</p>
                <p className="font-bold text-white">{Math.min(currentIndex + (showReveal ? 1 : 0), totalQuestions)} / {totalQuestions}</p>
              </div>
              <div className="bg-background border border-border rounded-lg p-2">
                <p className="text-[10px] uppercase text-slate-500">Стрик</p>
                <p className="font-bold text-yellow-400">x{streak}</p>
              </div>
              <div className="bg-background border border-border rounded-lg p-2">
                <p className="text-[10px] uppercase text-slate-500">Очки</p>
                <p className="font-bold text-primary">{points}</p>
              </div>
            </div>
          </div>

          {!result ? (
            <>
              {currentQuestion && (
                <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">Вопрос {currentIndex + 1} из {totalQuestions}</p>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${timeLeft <= 5 ? 'bg-red-500/20 text-red-300' : 'bg-primary/20 text-primary'}`}>
                      {timeLeft}s
                    </div>
                  </div>

                  <p className="text-lg font-bold">{currentQuestion.text}</p>

                  {currentQuestion.type === 'mcq' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {currentQuestion.options.map((opt, index) => (
                        <button
                          key={`${currentQuestion.id}-${index}`}
                          type="button"
                          disabled={showReveal}
                          onClick={() => evaluateAndReveal(currentQuestion.id, opt)}
                          className={`text-left p-3 rounded-lg border transition-all ${answers[currentQuestion.id] === opt ? 'border-primary bg-primary/20 text-white' : 'border-border bg-background hover:border-primary/60'} ${showReveal ? 'opacity-80' : ''}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 min-h-20"
                        placeholder="Введите ответ"
                        disabled={showReveal}
                      />
                      {!showReveal && (
                        <button
                          type="button"
                          onClick={() => evaluateAndReveal(currentQuestion.id, answers[currentQuestion.id] || '')}
                          className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover"
                        >
                          Ответить
                        </button>
                      )}
                    </div>
                  )}

                  {showReveal && (
                    <div className={`rounded-lg p-3 text-sm font-bold ${answerAccepted ? 'bg-green-500/10 text-green-300 border border-green-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30'}`}>
                      {answerAccepted ? 'Ответ принят! +очки за скорость 🎉' : 'Время вышло, переходим дальше ⚡'}
                    </div>
                  )}

                  <div className="flex justify-end">
                    {showReveal ? (
                      <button
                        onClick={goToNextQuestion}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover"
                      >
                        {currentIndex >= totalQuestions - 1 ? 'Завершить тест' : 'Следующий вопрос'}
                      </button>
                    ) : (
                      <button
                        onClick={handleTimeExpired}
                        className="px-4 py-2 bg-surface border border-border text-slate-300 rounded-lg font-bold hover:bg-white/5"
                      >
                        Пропустить
                      </button>
                    )}
                  </div>
                </div>
              )}

              {submitting && (
                <div className="bg-surface border border-border rounded-xl p-4 text-center text-slate-300">
                  Отправка результатов...
                </div>
              )}
            </>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-3">
              <div className="text-3xl font-black text-primary">{result.score}%</div>
              <p className="text-slate-300">Правильных ответов: {result.correct} из {result.total}</p>
              <p className="text-slate-300">Игровые очки: {points}</p>
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
