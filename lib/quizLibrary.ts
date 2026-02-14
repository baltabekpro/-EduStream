import type { Question, QuizConfig } from '../types';

export type SavedQuiz = {
  id: string;
  courseId?: string;
  materialId: string;
  materialTitle: string;
  serverQuizId?: string;
  createdAt: string;
  config: QuizConfig;
  questions: Question[];
};

const STORAGE_KEY = 'quizLibrary:v1';

const safeParse = (raw: string | null): SavedQuiz[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedQuiz[];
  } catch {
    return [];
  }
};

const writeAll = (items: SavedQuiz[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const newId = () => {
  try {
    // modern browsers
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
};

export const listSavedQuizzes = (): SavedQuiz[] => {
  const items = safeParse(localStorage.getItem(STORAGE_KEY));
  return items
    .filter(q => q && typeof q.id === 'string' && Array.isArray(q.questions))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
};

export const getSavedQuiz = (id: string): SavedQuiz | null => {
  const items = listSavedQuizzes();
  return items.find(q => q.id === id) || null;
};

export const saveQuizToLibrary = (input: Omit<SavedQuiz, 'id' | 'createdAt'>): SavedQuiz => {
  const quiz: SavedQuiz = {
    ...input,
    id: newId(),
    createdAt: new Date().toISOString(),
  };

  const items = listSavedQuizzes();
  writeAll([quiz, ...items]);
  window.dispatchEvent(new Event('quizLibraryUpdated'));
  return quiz;
};

export const deleteSavedQuiz = (id: string) => {
  const items = listSavedQuizzes();
  writeAll(items.filter(q => q.id !== id));
  window.dispatchEvent(new Event('quizLibraryUpdated'));
};

export const setSavedQuizServerQuizId = (id: string, serverQuizId: string) => {
  const items = listSavedQuizzes();
  const next = items.map(item => (
    item.id === id
      ? { ...item, serverQuizId }
      : item
  ));
  writeAll(next);
  window.dispatchEvent(new Event('quizLibraryUpdated'));
};

export const clearQuizLibrary = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('quizLibraryUpdated'));
};
