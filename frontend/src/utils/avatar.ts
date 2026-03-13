export const getInitials = (name?: string | null): string => {
    const cleanedName = String(name || '')
        .trim()
        .replace(/\s+/g, ' ');

    if (!cleanedName) {
        return 'CU';
    }

    const parts = cleanedName
        .split(' ')
        .map((part) => part.replace(/[^A-Za-z0-9]/g, ''))
        .filter(Boolean);

    if (parts.length === 0) {
        return 'CU';
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
};