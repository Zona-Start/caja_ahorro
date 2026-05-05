export const accountingRulesKeys = {
  all: ['accounting-rules'] as const,
  lists: () => [...accountingRulesKeys.all, 'list'] as const,
  list: (filters: string) => [...accountingRulesKeys.lists(), { filters }] as const,
  details: () => [...accountingRulesKeys.all, 'detail'] as const,
  detail: (id: string) => [...accountingRulesKeys.details(), id] as const,
};
