/**
 * Locale-aware formatting utilities for dates, numbers, and text
 * Supports Russian (ru), English (en), and Kazakh (kk) locales
 */

type Locale = 'ru' | 'en' | 'kk';

/**
 * Format a date according to locale conventions
 * @param date - Date object, ISO string, or undefined
 * @param locale - Target locale (ru, en, kk)
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string or empty string/fallback
 */
export function formatDate(
    date: Date | string | undefined,
    locale: Locale = 'ru',
    options?: Intl.DateTimeFormatOptions
): string {
    if (!date) return '—';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
        return typeof date === 'string' ? date : '';
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options
    };

    // Map locale to BCP 47 language tags
    const localeMap: Record<Locale, string> = {
        ru: 'ru-RU',
        en: 'en-US',
        kk: 'kk-KZ'
    };

    return new Intl.DateTimeFormat(localeMap[locale], defaultOptions).format(dateObj);
}

/**
 * Format a number according to locale conventions
 * @param number - Number to format
 * @param locale - Target locale (ru, en, kk)
 * @param options - Intl.NumberFormatOptions for customization
 * @returns Formatted number string
 */
export function formatNumber(
    number: number,
    locale: Locale = 'ru',
    options?: Intl.NumberFormatOptions
): string {
    if (!Number.isFinite(number)) {
        return '0';
    }

    const localeMap: Record<Locale, string> = {
        ru: 'ru-RU',
        en: 'en-US',
        kk: 'kk-KZ'
    };

    return new Intl.NumberFormat(localeMap[locale], options).format(number);
}

/**
 * Format relative time (e.g., "2 hours ago", "3 дня назад")
 * @param date - Date object or ISO string
 * @param locale - Target locale (ru, en, kk)
 * @returns Relative time string
 */
export function formatRelativeTime(
    date: Date | string,
    locale: Locale = 'ru'
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
        return '';
    }

    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    const translations: Record<Locale, Record<string, string>> = {
        ru: {
            justNow: 'только что',
            secondsAgo: 'сек. назад',
            minuteAgo: 'минуту назад',
            minutesAgo: 'мин. назад',
            hourAgo: 'час назад',
            hoursAgo: 'ч. назад',
            dayAgo: 'вчера',
            daysAgo: 'дн. назад',
            weekAgo: 'неделю назад',
            weeksAgo: 'нед. назад',
            monthAgo: 'месяц назад',
            monthsAgo: 'мес. назад',
            yearAgo: 'год назад',
            yearsAgo: 'г. назад'
        },
        en: {
            justNow: 'just now',
            secondsAgo: 'sec ago',
            minuteAgo: '1 min ago',
            minutesAgo: 'min ago',
            hourAgo: '1 hour ago',
            hoursAgo: 'hours ago',
            dayAgo: 'yesterday',
            daysAgo: 'days ago',
            weekAgo: '1 week ago',
            weeksAgo: 'weeks ago',
            monthAgo: '1 month ago',
            monthsAgo: 'months ago',
            yearAgo: '1 year ago',
            yearsAgo: 'years ago'
        },
        kk: {
            justNow: 'жаңа ғана',
            secondsAgo: 'сек. бұрын',
            minuteAgo: 'минут бұрын',
            minutesAgo: 'мин. бұрын',
            hourAgo: 'сағат бұрын',
            hoursAgo: 'сағ. бұрын',
            dayAgo: 'кеше',
            daysAgo: 'күн бұрын',
            weekAgo: 'апта бұрын',
            weeksAgo: 'апта бұрын',
            monthAgo: 'ай бұрын',
            monthsAgo: 'ай бұрын',
            yearAgo: 'жыл бұрын',
            yearsAgo: 'жыл бұрын'
        }
    };

    const t = translations[locale];

    if (diffSeconds < 10) return t.justNow;
    if (diffSeconds < 60) return `${diffSeconds} ${t.secondsAgo}`;
    if (diffMinutes === 1) return t.minuteAgo;
    if (diffMinutes < 60) return `${diffMinutes} ${t.minutesAgo}`;
    if (diffHours === 1) return t.hourAgo;
    if (diffHours < 24) return `${diffHours} ${t.hoursAgo}`;
    if (diffDays === 1) return t.dayAgo;
    if (diffDays < 7) return `${diffDays} ${t.daysAgo}`;
    if (diffWeeks === 1) return t.weekAgo;
    if (diffWeeks < 4) return `${diffWeeks} ${t.weeksAgo}`;
    if (diffMonths === 1) return t.monthAgo;
    if (diffMonths < 12) return `${diffMonths} ${t.monthsAgo}`;
    if (diffYears === 1) return t.yearAgo;
    return `${diffYears} ${t.yearsAgo}`;
}

/**
 * Sort an array of strings according to locale collation rules
 * @param array - Array of strings to sort
 * @param locale - Target locale (ru, en, kk)
 * @returns Sorted array (new array, does not mutate original)
 */
export function sortByLocale<T extends string>(
    array: T[],
    locale: Locale = 'ru'
): T[] {
    const localeMap: Record<Locale, string> = {
        ru: 'ru-RU',
        en: 'en-US',
        kk: 'kk-KZ'
    };

    return [...array].sort((a, b) => 
        a.localeCompare(b, localeMap[locale], { sensitivity: 'base' })
    );
}
