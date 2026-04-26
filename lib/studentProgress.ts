export type StudentProgressType = 'quiz' | 'assignment';

export interface StudentProgressEntry {
  id: string;
  type: StudentProgressType;
  title: string;
  code: string;
  studentName: string;
  score: number | null;
  maxScore: number | null;
  status: 'submitted' | 'graded' | 'reviewed';
  submittedAt: string;
}

const STUDENT_PROGRESS_STORAGE_KEY = 'studentProgressHistory';

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const safeParse = (raw: string | null): StudentProgressEntry[] => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is StudentProgressEntry => {
      return Boolean(
        item
        && typeof item.id === 'string'
        && (item.type === 'quiz' || item.type === 'assignment')
        && typeof item.title === 'string'
        && typeof item.code === 'string'
        && typeof item.studentName === 'string'
        && typeof item.submittedAt === 'string'
      );
    });
  } catch {
    return [];
  }
};

export const getStudentProgressHistory = (): StudentProgressEntry[] => {
  if (!isBrowser()) return [];
  return safeParse(localStorage.getItem(STUDENT_PROGRESS_STORAGE_KEY));
};

export const recordStudentProgress = (entry: Omit<StudentProgressEntry, 'id' | 'submittedAt'> & { submittedAt?: string }) => {
  if (!isBrowser()) return;

  const history = getStudentProgressHistory();
  const nextEntry: StudentProgressEntry = {
    ...entry,
    id: `${entry.type}:${entry.code}:${entry.studentName}:${entry.submittedAt || new Date().toISOString()}`,
    submittedAt: entry.submittedAt || new Date().toISOString(),
  };

  const nextHistory = [nextEntry, ...history.filter((item) => item.id !== nextEntry.id)].slice(0, 20);
  localStorage.setItem(STUDENT_PROGRESS_STORAGE_KEY, JSON.stringify(nextHistory));
};
