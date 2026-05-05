export const typeCreditsKeys = {
  all: ['typeCredits'] as const,
  lists: () => [...typeCreditsKeys.all, 'list'] as const,
  list: (params: string) => [...typeCreditsKeys.lists(), params] as const,
  details: () => [...typeCreditsKeys.all, 'detail'] as const,
  detail: (id: number) => [...typeCreditsKeys.details(), id] as const,
};