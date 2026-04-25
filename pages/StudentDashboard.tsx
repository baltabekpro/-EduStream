import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { t } = useLanguage();

  return (
    <PageTransition>
      <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-black text-white">{t('student.dashboard.greeting')}, {user?.firstName || t('student.dashboard.student')}</h1>
          <p className="text-slate-400 mt-2">{t('student.dashboard.selectSection')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
          <div className="bg-surface border border-border rounded-2xl p-5 md:p-6">
            <h2 className="text-lg font-bold text-white mb-2">{t('student.dashboard.myAssignments')}</h2>
            <p className="text-sm text-slate-300 mb-4">{t('student.dashboard.myAssignmentsDesc')}</p>
            <button
              type="button"
              onClick={() => navigate('/student-assignments')}
              className="px-3 py-2 rounded-lg border border-border bg-background text-slate-300 hover:text-white hover:border-primary/60 text-sm font-bold"
            >
              {t('student.dashboard.openAssignments')}
            </button>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 md:p-6">
            <h2 className="text-lg font-bold text-white mb-2">{t('student.dashboard.myTests')}</h2>
            <p className="text-sm text-slate-300 mb-4">{t('student.dashboard.myTestsDesc')}</p>
            <button
              type="button"
              onClick={() => navigate('/student-tests')}
              className="px-3 py-2 rounded-lg border border-border bg-background text-slate-300 hover:text-white hover:border-primary/60 text-sm font-bold"
            >
              {t('student.dashboard.openTests')}
            </button>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 md:p-6 max-w-2xl">
          <h2 className="text-lg font-bold text-white mb-2">{t('student.dashboard.myProgress')}</h2>
          <p className="text-slate-400 text-sm">{t('student.dashboard.progressDesc')}</p>
        </div>
      </div>
    </PageTransition>
  );
};

export default StudentDashboard;
