export type PaginatedResponse<T> = {
  items?: T[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export const getCollectionItems = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object' && Array.isArray((payload as PaginatedResponse<T>).items)) {
    return ((payload as PaginatedResponse<T>).items || []) as T[];
  }

  return [];
};

export const getCollectionTotal = <T>(payload: unknown): number | null => {
  if (payload && typeof payload === 'object') {
    const total = (payload as PaginatedResponse<T>).meta?.total;
    if (typeof total === 'number' && Number.isFinite(total)) {
      return total;
    }
  }
  return null;
};
