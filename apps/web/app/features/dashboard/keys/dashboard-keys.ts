export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  statsByTenant: (tenantId: string) =>
    [...dashboardKeys.stats(), tenantId] as const,
};
