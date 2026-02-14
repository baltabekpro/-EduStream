import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { useUser } from '../context/UserContext';

const RECENT_CODES_KEY = 'recentShareCodes';
const LAST_OPENED_CODE_KEY = 'lastOpenedShareCode';
const SHARE_CODE_PATTERN = /^[A-Za-z0-9_-]{6,32}$/;

const getRecentCodes = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_CODES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [shareCode, setShareCode] = useState('');
  const [shareCodeError, setShareCodeError] = useState('');
  const [recentCodes, setRecentCodes] = useState<string[]>(getRecentCodes());
  const [lastOpenedCode] = useState<string>(() => localStorage.getItem(LAST_OPENED_CODE_KEY) || '');

  const saveRecentCode = (code: string) => {
    const next = [code, ...recentCodes.filter((item) => item !== code)].slice(0, 5);
    setRecentCodes(next);
    localStorage.setItem(RECENT_CODES_KEY, JSON.stringify(next));
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
    localStorage.setItem(LAST_OPENED_CODE_KEY, normalized);
    navigate(`/shared/${encodeURIComponent(normalized)}`);
  };

  return (
    <PageTransition>
      <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-black text-white">Здравствуйте, {user?.firstName || 'ученик'}</h1>
          <p className="text-slate-400 mt-2">Сценарий: получите код от учителя → откройте задание → выполните тест или загрузите документ.</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-white mb-2">Как работать с заданиями</h2>
          <div className="space-y-1 text-sm text-slate-300 mb-4">
            <p>1) Получите код от учителя</p>
            <p>2) Откройте задание по коду</p>
            <p>3) Выполните тест или загрузите документ</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/student-assignments')}
            className="mb-4 px-3 py-2 rounded-lg border border-border bg-background text-slate-300 hover:text-white hover:border-primary/60 text-sm font-bold"
          >
            Перейти в окно заданий
          </button>
          {lastOpenedCode && (
            <button
              type="button"
              onClick={() => navigate(`/shared/${encodeURIComponent(lastOpenedCode)}`)}
              className="mb-4 px-3 py-2 rounded-lg border border-border bg-background text-slate-300 hover:text-white hover:border-primary/60 text-sm font-bold"
            >
              Продолжить последнее задание: {lastOpenedCode}
            </button>
          )}
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-white mb-3">Присоединиться к заданию</h2>
          <p className="text-xs text-slate-500 mb-3">Шаг 1: введите код от учителя или выберите код из последних.</p>
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
              placeholder="Введите код из ссылки учителя"
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-white"
            />
            <button
              onClick={openByCode}
              className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover"
            >
              Открыть
            </button>
          </div>
          {recentCodes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
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
          {shareCodeError && <p className="text-xs text-red-400 mt-2">{shareCodeError}</p>}
          <p className="text-xs text-slate-500 mt-3">Код выдаёт учитель после публикации теста или задания.</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-white mb-2">Мой прогресс</h2>
          <p className="text-slate-400 text-sm">История попыток и аналитика будут отображаться здесь по мере выполнения заданий.</p>
        </div>
      </div>
    </PageTransition>
  );
};

export default StudentDashboard;
