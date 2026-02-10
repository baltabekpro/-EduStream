type TimeSavedCounters = {
  materialsUploaded: number;
  quizzesGenerated: number;
  worksChecked: number;
};

const STORAGE_KEY = 'timeSavedCounters';

const DEFAULT_COUNTERS: TimeSavedCounters = {
  materialsUploaded: 0,
  quizzesGenerated: 0,
  worksChecked: 0,
};

const HOURS_PER_ACTION: TimeSavedCounters = {
  materialsUploaded: 0.2, // ~12 min
  quizzesGenerated: 0.5,  // ~30 min
  worksChecked: 0.15,     // ~9 min
};

const toNumber = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const readCounters = (): TimeSavedCounters => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_COUNTERS };
    const parsed = JSON.parse(raw) as Partial<TimeSavedCounters>;
    return {
      materialsUploaded: toNumber(parsed.materialsUploaded),
      quizzesGenerated: toNumber(parsed.quizzesGenerated),
      worksChecked: toNumber(parsed.worksChecked),
    };
  } catch {
    return { ...DEFAULT_COUNTERS };
  }
};

const writeCounters = (counters: TimeSavedCounters) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
  window.dispatchEvent(new Event('timeSavedUpdated'));
};

export const incrementTimeSaved = (key: keyof TimeSavedCounters, amount = 1) => {
  const counters = readCounters();
  counters[key] = toNumber(counters[key]) + amount;
  writeCounters(counters);
};

export const getTimeSavedHours = () => {
  const counters = readCounters();
  const hours =
    counters.materialsUploaded * HOURS_PER_ACTION.materialsUploaded +
    counters.quizzesGenerated * HOURS_PER_ACTION.quizzesGenerated +
    counters.worksChecked * HOURS_PER_ACTION.worksChecked;
  return Math.round(hours * 10) / 10;
};
