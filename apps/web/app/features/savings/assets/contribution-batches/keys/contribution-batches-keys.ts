export const contributionBatchesKeys = {
  all: ['contributionBatches'] as const,
  lists: () => [...contributionBatchesKeys.all, 'list'] as const,
  list: (params: string) => [...contributionBatchesKeys.lists(), params] as const,
  details: () => [...contributionBatchesKeys.all, 'detail'] as const,
  detail: (id: string) => [...contributionBatchesKeys.details(), id] as const,
};
