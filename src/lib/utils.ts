/**
 * Safely formats a date string using toLocaleDateString.
 * Prevents RangeError: Invalid time value when date is missing or invalid.
 */
export const formatDate = (date: string | Date | null | undefined, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: '2-digit' }, locale: string = 'en-IN') => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString(locale, options);
};

/**
 * Safely formats a time string using toLocaleTimeString.
 */
export const formatTime = (date: string | Date | null | undefined, options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }, locale: string = 'en-IN') => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Time';
    return d.toLocaleTimeString(locale, options);
};

/**
 * Safely formats a date and time string using toLocaleString.
 */
export const formatDateTime = (date: string | Date | null | undefined, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }, locale: string = 'en-IN') => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date/Time';
    return d.toLocaleString(locale, options);
};

/**
 * Safely formats a date relative to now.
 */
export const formatRelativeTime = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hrs ago`;

    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};
