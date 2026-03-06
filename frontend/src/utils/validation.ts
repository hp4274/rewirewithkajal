const DATE_DD_MM_YYYY_REGEX = /^(\d{2})-(\d{2})-(\d{4})$/;
const DATE_YYYY_MM_DD_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MOBILE_10_REGEX = /^\d{10}$/;
export const SLOT_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const buildDate = (year: number, month: number, day: number): Date | null => {
    const date = new Date(year, month - 1, day);
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }
    date.setHours(0, 0, 0, 0);
    return date;
};

export const normalizeDateInput = (value: string): string | null => {
    if (!value) return null;
    const input = value.trim();
    if (!input) return null;

    const datePart = input.includes('T') ? input.split('T')[0] : input.split(' ')[0];

    const ddmmyyyyMatch = datePart.match(DATE_DD_MM_YYYY_REGEX);
    if (ddmmyyyyMatch) {
        const day = Number(ddmmyyyyMatch[1]);
        const month = Number(ddmmyyyyMatch[2]);
        const year = Number(ddmmyyyyMatch[3]);
        const parsed = buildDate(year, month, day);
        if (!parsed) return null;
        return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    const yyyymmddMatch = datePart.match(DATE_YYYY_MM_DD_REGEX);
    if (yyyymmddMatch) {
        const year = Number(yyyymmddMatch[1]);
        const month = Number(yyyymmddMatch[2]);
        const day = Number(yyyymmddMatch[3]);
        const parsed = buildDate(year, month, day);
        if (!parsed) return null;
        return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    return null;
};

export const toDateInputString = (date = new Date()): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

export const isDobNotFuture = (value: string): boolean => {
    const normalized = normalizeDateInput(value);
    if (!normalized) return false;
    const today = toDateInputString(new Date());
    return normalized <= today;
};

export const isTodayOrFutureDate = (value: string): boolean => {
    const normalized = normalizeDateInput(value);
    if (!normalized) return false;
    const today = toDateInputString(new Date());
    return normalized >= today;
};

export const isValidEmail = (value: string): boolean => {
    const input = value.trim();
    if (!input || input.includes(' ')) return false;
    return EMAIL_REGEX.test(input);
};

export const isValidMobile10 = (value: string): boolean => {
    return MOBILE_10_REGEX.test(value.trim());
};

export const isValidSlot = (value: string): boolean => {
    return SLOT_24H_REGEX.test(value.trim());
};

export const isFutureOrCurrentSlot = (dateValue: string, slot: string): boolean => {
    const normalizedDate = normalizeDateInput(dateValue);
    if (!normalizedDate || !isValidSlot(slot)) return false;

    const [year, month, day] = normalizedDate.split('-').map(Number);
    const [hour, minute] = slot.split(':').map(Number);

    const selected = new Date(year, month - 1, day, hour, minute, 0, 0);
    return selected.getTime() >= Date.now();
};
