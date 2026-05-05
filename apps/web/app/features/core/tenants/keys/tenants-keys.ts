export const tenantsKeys = {
  all: ['tenants'] as const,
  lists: () => [...tenantsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...tenantsKeys.lists(), filters] as const,
  counts: () => [...tenantsKeys.all, 'count'] as const,
  count: () => [...tenantsKeys.counts()] as const,
  details: () => [...tenantsKeys.all, 'detail'] as const,
  detail: (id: string) => [...tenantsKeys.details(), id] as const,
  byRif: (rif: string) => [...tenantsKeys.all, 'rif', rif] as const,
};

