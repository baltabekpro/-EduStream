import type { Question, QuizConfig } from '../types';

type StoredMessage = {
  id: number;
  type: 'user' | 'ai';
  text: string;
};

type AISessionState = {
  messages: StoredMessage[];
  testQuestions: Question[];
  testConfig: QuizConfig;
  updatedAt: string;
};

const keyFor = (docId: string) => `aiSession:${docId}`;

export const loadAISession = (docId: string): AISessionState | null => {
  try {
    const raw = localStorage.getItem(keyFor(docId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AISessionState;
    if (!parsed || !Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveAISession = (docId: string, state: Omit<AISessionState, 'updatedAt'>) => {
  const payload: AISessionState = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(keyFor(docId), JSON.stringify(payload));
};

export const clearAISession = (docId: string) => {
  localStorage.removeItem(keyFor(docId));
};
