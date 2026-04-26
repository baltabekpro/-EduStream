import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShareService, ApiError } from '../lib/api';
import { PageTransition } from '../components/PageTransition';
import type { SharedQuizPayload, SharedQuizResult } from '../types';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { recordStudentProgress } from '../lib/studentProgress';

const QUESTION_TIME = 20;
const MAX_ASSIGNMENT_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_ASSIGNMENT_EXTENSIONS = ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'bmp', 'tif', 'tiff', 'webp'];
const STUDENT_NAME_STORAGE_KEY = 'studentDisplayName';
const SHARE_CODE_PATTERN = /^[A-Za-z0-9_-]{6,32}$/;
const COMPLETED_SUBMISSIONS_STORAGE_KEY = 'sharedSubmissionHistory';

type CompletedSharedSubmission = {
  resourceType: 'quiz' | 'material';
  code: string;
  studentKey: string;
  studentName: string;
  title: string;
  score: number | null;
  total: number | null;
  submittedAt: string;
};

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

const loadCompletedSubmissions = (): Record<string, CompletedSharedSubmission> => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return {};

  try {
    const raw = localStorage.getItem(COMPLETED_SUBMISSIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const saveCompletedSubmission = (submission: CompletedSharedSubmission) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

  const next = loadCompletedSubmissions();
  next[`${submission.resourceType}:${submission.code}:${submission.studentKey}`] = submission;
  localStorage.setItem(COMPLETED_SUBMISSIONS_STORAGE_KEY, JSON.stringify(next));
};

const SharedQuiz: React.FC = () => {
  const navigate = useNavigate();
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
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showReveal, setShowReveal] = useState(false);
  const [answerAccepted, setAnswerAccepted] = useState<boolean | null>(null);

  const studentDisplayName = useMemo(() => {
    const profileName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    return profileName || studentName.trim() || t('shared.student');
  }, [studentName, t, user?.firstName, user?.lastName]);

  const studentKey = studentDisplayName.trim().toLowerCase();

  const completedSubmission = useMemo(() => {
    if (!quiz) return null;
    const recordKey = `${quiz.resourceType}:${normalizedCode}:${studentKey}`;
    return loadCompletedSubmissions()[recordKey] || null;
  }, [normalizedCode, quiz, studentKey]);

  const hasUnsavedWork = Boolean(
    quiz && !result && !submissionNotice && (
      assignmentFile
      || assignmentText.trim()
      || Object.values(answers).some((answer) => answer.trim().length > 0)
      || currentIndex > 0
      || showReveal
    )
  );

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
      setSubmissionNotice(null);
      setUploadMessage('');
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

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedWork) return;

      event.preventDefault();
      event.returnValue = t('shared.leaveWarning');
      return event.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedWork, t]);

  const handleLeave = () => {
    setShowLeaveModal(true);
  };

  const confirmLeave = () => {
    setShowLeaveModal(false);
    navigate(quiz?.resourceType === 'material' ? '/student-assignments' : '/student-tests');
  };

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
    if (!studentDisplayName.trim()) {
      setError(t('shared.enterNameBeforeSubmit'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const data = await ShareService.submit(normalizedCode, studentDisplayName.trim(), answers);
      recordStudentProgress({
        type: 'quiz',
        title: quiz.title,
        code: normalizedCode,
        studentName: studentDisplayName.trim(),
        score: data.score,
        maxScore: data.total,
        status: 'graded',
      });
      saveCompletedSubmission({
        resourceType: 'quiz',
        code: normalizedCode,
        studentKey,
        studentName: studentDisplayName.trim(),
        title: quiz.title,
        score: data.score,
        total: data.total,
        submittedAt: new Date().toISOString(),
      });
      setResult(data);
    } catch (e: any) {
      setError(e.message || t('shared.failedToSubmitAnswers'));
    } finally {
      setSubmitting(false);
    }
  };

  const submitAssignment = async () => {
    if (!normalizedCode) return;
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
      const submittedAt = new Date().toISOString();
      setUploadMessage(data.message || t('shared.answerSentSuccessfully'));
      setSubmissionNotice(data.message || t('shared.answerSentSuccessfully'));
      recordStudentProgress({
        type: 'assignment',
        title: quiz?.title || t('shared.student'),
        code: normalizedCode,
        studentName: effectiveStudentName,
        score: null,
        maxScore: null,
        status: 'submitted',
      });
      saveCompletedSubmission({
        resourceType: 'material',
        code: normalizedCode,
        studentKey,
        studentName: effectiveStudentName,
        title: quiz?.title || t('shared.student'),
        score: null,
        total: null,
        submittedAt,
      });
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
            <h1 className="text-xl font-black text-white">{t('shared.passwordProtected')}</h1>
            <p className="text-slate-400 text-sm">{t('shared.enterPassword')}</p>
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
              {t('shared.open')}
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
          {error || t('shared.notFound')}
        </div>
      </PageTransition>
    );
  }

  if (completedSubmission && !result && !submissionNotice) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background text-white p-4 md:p-8 flex items-center justify-center">
          <div className="w-full max-w-xl bg-surface border border-border rounded-2xl p-6 space-y-4 text-center">
            <div className="mx-auto size-14 rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">task_alt</span>
            </div>
            <h1 className="text-2xl font-black">{t('shared.alreadySubmittedTitle')}</h1>
            <p className="text-slate-400 text-sm">
              {completedSubmission.resourceType === 'material' ? t('shared.alreadySubmittedAssignmentDesc') : t('shared.alreadySubmittedQuizDesc')}
            </p>
            <p className="text-xs text-slate-500">
              {t('shared.alreadySubmittedAt')}: {new Date(completedSubmission.submittedAt).toLocaleString()}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(completedSubmission.resourceType === 'material' ? '/student-assignments' : '/student-tests')}
                className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover"
              >
                {completedSubmission.resourceType === 'material' ? t('shared.backToAssignments') : t('shared.backToTests')}
              </button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (quiz.resourceType === 'material') {
    if (submissionNotice) {
      return (
        <PageTransition>
          <div className="min-h-screen bg-background text-white p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-xl bg-surface border border-border rounded-2xl p-6 space-y-4 text-center">
              <div className="mx-auto size-14 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">done</span>
              </div>
              <h1 className="text-2xl font-black">{t('shared.submissionSentTitle')}</h1>
              <p className="text-slate-400 text-sm">{submissionNotice}</p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/student-assignments')}
                  className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover"
                >
                  {t('shared.backToAssignments')}
                </button>
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
            <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
              <h1 className="text-2xl font-black">{quiz.title}</h1>
              <p className="text-slate-400 text-sm">{t('shared.assignmentInstruction')}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-full bg-background border border-border text-slate-300">{t('shared.assignmentStep1')}</span>
                <span className="px-2 py-1 rounded-full bg-background border border-border text-slate-300">{t('shared.assignmentStep2')}</span>
                <span className="px-2 py-1 rounded-full bg-background border border-border text-slate-300">{t('shared.assignmentStep3')}</span>
              </div>
              {quiz.description && (
                <div
                  className="bg-background border border-border rounded-lg p-3 text-sm text-slate-300"
                  dangerouslySetInnerHTML={{ __html: renderAssignmentHtml(quiz.description) }}
                />
              )}
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
              <div className="w-full bg-background border border-border rounded-lg px-3 py-2 text-slate-300 text-sm">
                {t('shared.student')}: {studentDisplayName}
              </div>
              <textarea
                value={assignmentText}
                onChange={(e) => setAssignmentText(e.target.value)}
                placeholder={t('shared.assignmentTextPlaceholder')}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white min-h-28"
              />
              <input
                type="file"
                onChange={(e) => onAssignmentFileChange(e.target.files?.[0] || null)}
                accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.bmp,.tif,.tiff,.webp"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white"
              />
              <p className="text-xs text-slate-400">{t('shared.assignmentSupportedFiles')}</p>
              {assignmentFile && <p className="text-xs text-slate-400">{t('shared.assignmentSelectedFile')}: {assignmentFile.name}</p>}
              <button
                type="button"
                onClick={submitAssignment}
                disabled={submitting || (!assignmentFile && !assignmentText.trim())}
                className="w-full bg-primary text-white rounded-xl py-3 font-bold hover:bg-primary-hover disabled:opacity-60"
              >
                {submitting ? t('shared.submitting') : t('shared.submitAnswer')}
              </button>
              {uploadMessage && <p className="text-green-400 text-sm">{uploadMessage}</p>}
              {uploadMessage && <p className="text-xs text-slate-400">{t('shared.assignmentFollowUp')}</p>}
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
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black">{quiz.title}</h1>
                <p className="text-slate-400 text-sm mt-1">{quiz.resourceType === 'material' ? t('student.assignments.title') : t('student.tests.title')}</p>
              </div>
              <button
                type="button"
                onClick={handleLeave}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-slate-300 hover:text-white hover:border-primary/60 text-sm font-bold"
              >
                <span className="material-symbols-outlined text-base">exit_to_app</span>
                {t('shared.leave')}
              </button>
            </div>
            <p className="text-slate-400 text-sm mt-1">{t('shared.quizMode')}</p>
            <input
              value={studentName}
              onChange={(e) => {
                const value = e.target.value;
                setStudentName(value);
                localStorage.setItem(STUDENT_NAME_STORAGE_KEY, value);
              }}
              placeholder={t('shared.yourName')}
              className="mt-4 w-full bg-background border border-border rounded-lg px-3 py-2 text-white"
            />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="bg-background border border-border rounded-lg p-2">
                <p className="text-[10px] uppercase text-slate-500">{t('shared.progressLabel')}</p>
                <p className="font-bold text-white">{Math.min(currentIndex + (showReveal ? 1 : 0), totalQuestions)} / {totalQuestions}</p>
              </div>
              <div className="bg-background border border-border rounded-lg p-2">
                <p className="text-[10px] uppercase text-slate-500">{t('shared.streakLabel')}</p>
                <p className="font-bold text-yellow-400">x{streak}</p>
              </div>
              <div className="bg-background border border-border rounded-lg p-2">
                <p className="text-[10px] uppercase text-slate-500">{t('shared.pointsLabel')}</p>
                <p className="font-bold text-primary">{points}</p>
              </div>
            </div>
          </div>

          {!result ? (
            <>
              {currentQuestion && (
                <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">{t('shared.question')} {currentIndex + 1} {t('shared.of')} {totalQuestions}</p>
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
                        placeholder={t('shared.enterAnswer')}
                        disabled={showReveal}
                      />
                      {!showReveal && (
                        <button
                          type="button"
                          onClick={() => evaluateAndReveal(currentQuestion.id, answers[currentQuestion.id] || '')}
                          className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover"
                        >
                          {t('shared.answer')}
                        </button>
                      )}
                    </div>
                  )}

                  {showReveal && (
                    <div className={`rounded-lg p-3 text-sm font-bold ${answerAccepted ? 'bg-green-500/10 text-green-300 border border-green-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30'}`}>
                      {answerAccepted ? t('shared.answerAccepted') : t('shared.timeOut')}
                    </div>
                  )}

                  <div className="flex justify-end">
                    {showReveal ? (
                      <button
                        onClick={goToNextQuestion}
                        className="px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover"
                      >
                        {currentIndex >= totalQuestions - 1 ? t('shared.finishTest') : t('shared.nextQuestion')}
                      </button>
                    ) : (
                      <button
                        onClick={handleTimeExpired}
                        className="px-4 py-2 bg-surface border border-border text-slate-300 rounded-lg font-bold hover:bg-white/5"
                      >
                        {t('shared.skip')}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {submitting && (
                <div className="bg-surface border border-border rounded-xl p-4 text-center text-slate-300">
                  {t('shared.submittingResults')}
                </div>
              )}
            </>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-3">
              <div className="text-3xl font-black text-primary">{result.score}%</div>
              <p className="text-slate-300">{t('shared.correctAnswersPrefix')} {result.correct} {t('shared.of')} {result.total}</p>
              <p className="text-slate-300">{t('shared.gamePoints')}: {points}</p>
              <p className="text-slate-400 text-sm">{t('shared.resultSent')}</p>
            </div>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      </div>
      {showLeaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLeaveModal(false)}></div>
          <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-white mb-3">{t('shared.leave')}</h3>
            <p className="text-slate-400 text-sm mb-6">{t('shared.leaveConfirm')}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 px-4 py-2 border border-border text-slate-300 rounded-xl font-bold hover:bg-white/5 hover:text-white transition-colors"
              >
                {t('ocr.cancel')}
              </button>
              <button
                type="button"
                onClick={confirmLeave}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-colors"
              >
                {t('shared.leave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
};

export default SharedQuiz;
