import { useQuery } from '@tanstack/react-query';
import { categoryTypesService } from '../services/category-types-service';

export const categoryTypesKeys = {
  all: ['category-types'] as const,
  group: (group: string) => [...categoryTypesKeys.all, 'group', group] as const,
};

export function useCategoriesTypesGroup(group: string) {
  return useQuery({
    queryKey: categoryTypesKeys.group(group),
    queryFn: () => categoryTypesService.getByGroup(group),
    enabled: !!group,
  });
}
