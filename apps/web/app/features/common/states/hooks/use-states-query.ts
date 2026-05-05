import { useQuery } from '@tanstack/react-query';
import { statesService } from '../services/states-service';

export const statesKeys = {
  all: ['states'] as const,
};

export function useStatesQuery() {
  return useQuery({
    queryKey: statesKeys.all,
    queryFn: () => statesService.getAll(),
  });
}
