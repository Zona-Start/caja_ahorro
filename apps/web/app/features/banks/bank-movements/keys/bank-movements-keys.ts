export const bankMovementsKeys = {
  all: ['bank-movements'] as const,
  lists: () => [...bankMovementsKeys.all, 'list'] as const,
  list: (filters: object) => [...bankMovementsKeys.lists(), filters] as const,
  details: () => [...bankMovementsKeys.all, 'detail'] as const,
  detail: (id: string) => [...bankMovementsKeys.details(), id] as const,
};
