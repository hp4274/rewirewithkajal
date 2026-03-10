export type PaginationOptions = {
  defaultLimit?: number;
  maxLimit?: number;
};

export type PaginationResult = {
  page: number;
  limit: number;
  offset: number;
};

const toPositiveInt = (value: unknown): number | null => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
};

export const parsePagination = (
  rawPage: unknown,
  rawLimit: unknown,
  options: PaginationOptions = {}
): PaginationResult => {
  const defaultLimit = options.defaultLimit ?? 50;
  const maxLimit = options.maxLimit ?? 200;

  const page = toPositiveInt(rawPage) ?? 1;
  const requestedLimit = toPositiveInt(rawLimit) ?? defaultLimit;
  const limit = Math.min(requestedLimit, maxLimit);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const buildPaginationMeta = (total: number, page: number, limit: number) => {
  const safeTotal = Number.isFinite(total) ? Math.max(0, total) : 0;
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(safeTotal / limit)) : 1;
  return {
    page,
    limit,
    total: safeTotal,
    totalPages,
  };
};
