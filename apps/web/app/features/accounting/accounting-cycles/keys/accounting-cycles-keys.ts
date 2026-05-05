export const accountingCyclesKeys = {
  all: ['accounting-cycles'] as const,
  lists: () => [...accountingCyclesKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...accountingCyclesKeys.lists(), filters] as const,
  details: () => [...accountingCyclesKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountingCyclesKeys.details(), id] as const,
};
