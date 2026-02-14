import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { useUser } from '../context/UserContext';

const RECENT_ASSIGNMENT_CODES_KEY = 'recentAssignmentCodes';
const LAST_OPENED_ASSIGNMENT_CODE_KEY = 'lastOpenedAssignmentCode';
const SHARE_CODE_PATTERN = /^[A-Za-z0-9_-]{6,32}$/;

const getRecentCodes = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_ASSIGNMENT_CODES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const StudentAssignments: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const [shareCode, setShareCode] = useState('');
  const [shareCodeError, setShareCodeError] = useState('');
  const [recentCodes, setRecentCodes] = useState<string[]>(getRecentCodes());
  const [lastOpenedCode] = useState<string>(() => localStorage.getItem(LAST_OPENED_ASSIGNMENT_CODE_KEY) || '');

  const saveRecentCode = (code: string) => {
    const next = [code, ...recentCodes.filter((item) => item !== code)].slice(0, 8);
    setRecentCodes(next);
    localStorage.setItem(RECENT_ASSIGNMENT_CODES_KEY, JSON.stringify(next));
  };

  const openByCode = () => {
    const normalized = shareCode.trim().replace(/\s+/g, '');
    if (!normalized) {
      setShareCodeError('Введите код задания');
      return;
    }
    if (!SHARE_CODE_PATTERN.test(normalized)) {
      setShareCodeError('Проверьте код из ссылки учителя');
      return;
    }

    setShareCodeError('');
    saveRecentCode(normalized);
    localStorage.setItem(LAST_OPENED_ASSIGNMENT_CODE_KEY, normalized);
    navigate(`/shared/${encodeURIComponent(normalized)}`);
  };

  return (
    <PageTransition>
      <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-black text-white">Задания ученика</h1>
          <p className="text-slate-400 mt-2">Здравствуйте, {user?.firstName || 'ученик'}! Здесь собраны ваши задания с возможностью отправить файл и/или текстовый ответ.</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 max-w-3xl space-y-4">
          <h2 className="text-lg font-bold text-white">Открыть задание по коду</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={shareCode}
              onChange={(e) => {
                setShareCode(e.target.value);
                if (shareCodeError) setShareCodeError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  openByCode();
                }
              }}
              placeholder="Введите код задания"
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-white"
            />
            <button
              onClick={openByCode}
              className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover"
            >
              Открыть
            </button>
          </div>
          {shareCodeError && <p className="text-xs text-red-400">{shareCodeError}</p>}

          {lastOpenedCode && (
            <button
              type="button"
              onClick={() => navigate(`/shared/${encodeURIComponent(lastOpenedCode)}`)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-slate-300 hover:text-white hover:border-primary/60 text-sm font-bold"
            >
              Продолжить последнее задание: {lastOpenedCode}
            </button>
          )}

          {recentCodes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recentCodes.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setShareCode(code);
                    setShareCodeError('');
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-slate-300 hover:text-white hover:border-primary/60"
                >
                  {code}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default StudentAssignments;
