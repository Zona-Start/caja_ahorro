import { QUERY_KEYS } from '@/lib/query-keys';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { UsersFilters } from './use-users-filters';
import { usersService } from '../services/users-service';
import type { User } from '../schemas/users.schema';

export function useUsersQuery(
  filters: UsersFilters,
): UseQueryResult<{ data: User[]; total: number; page: number; limit: number; totalPages: number }> {
  return useQuery({
    queryKey: QUERY_KEYS.users.list(filters),
    queryFn: () => usersService.getAll(filters),
  });
}

export function useUserQuery(
  id: string,
  enabled: boolean = true,
): UseQueryResult<User> {
  return useQuery({
    queryKey: QUERY_KEYS.users.detail(id),
    queryFn: () => usersService.getById(id),
    enabled: enabled && !!id,
  });
}