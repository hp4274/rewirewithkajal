const DATE_DD_MM_YYYY_REGEX = /^(\d{2})-(\d{2})-(\d{4})$/;
const DATE_YYYY_MM_DD_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_10_REGEX = /^\d{10}$/;
const SLOT_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

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

export const normalizeDateInput = (value: unknown): string | null => {
    if (value instanceof Date) {
        if (isNaN(value.getTime())) return null;
        const year = value.getFullYear();
        const month = value.getMonth() + 1;
        const day = value.getDate();
        return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    if (typeof value !== 'string') return null;
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
        return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    const yyyymmddMatch = datePart.match(DATE_YYYY_MM_DD_REGEX);
    if (yyyymmddMatch) {
        const year = Number(yyyymmddMatch[1]);
        const month = Number(yyyymmddMatch[2]);
        const day = Number(yyyymmddMatch[3]);
        const parsed = buildDate(year, month, day);
        if (!parsed) return null;
        return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    return null;
};

export const isoDateToDdMmYyyy = (isoDate: string): string => {
    const match = isoDate.match(DATE_YYYY_MM_DD_REGEX);
    if (!match) return isoDate;
    return `${match[3]}-${match[2]}-${match[1]}`;
};

export const isDobNotFuture = (isoDate: string): boolean => {
    const parsed = normalizeDateInput(isoDate);
    if (!parsed) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return parsed <= `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export const isTodayOrFutureDate = (isoDate: string): boolean => {
    const parsed = normalizeDateInput(isoDate);
    if (!parsed) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return parsed >= `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export const isValidEmail = (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    const input = value.trim();
    if (!input || input.includes(' ')) return false;
    return EMAIL_REGEX.test(input);
};

export const isValidMobile10 = (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    return MOBILE_10_REGEX.test(value.trim());
};

export const isValidSlotTime = (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    return SLOT_24H_REGEX.test(value.trim());
};

export const buildAppointmentTimestamp = (isoDate: string, slot: string): string => {
    const normalizedDate = normalizeDateInput(isoDate);
    const normalizedSlot = String(slot).trim().slice(0, 5);
    if (!normalizedDate || !isValidSlotTime(normalizedSlot)) {
        throw new Error('Invalid appointment date or slot.');
    }
    return `${normalizedDate}T${normalizedSlot}:00`;
};

export const isDateTimeInPast = (isoDate: string, slot: string): boolean => {
    const normalizedDate = normalizeDateInput(isoDate);
    const normalizedSlot = String(slot).trim().slice(0, 5);
    if (!normalizedDate || !isValidSlotTime(normalizedSlot)) return true;

    const [hour, minute] = normalizedSlot.split(':').map(Number);
    const [year, month, day] = normalizedDate.split('-').map(Number);
    const dateTime = new Date(year, month - 1, day, hour, minute, 0, 0);
    return dateTime.getTime() < Date.now();
};
