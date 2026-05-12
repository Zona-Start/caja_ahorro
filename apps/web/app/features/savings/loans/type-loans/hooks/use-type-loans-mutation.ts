import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { type LoanType, type LoanTypeMutation } from '../schemas/loan-types.schema';
import { loanTypesService } from '../services/type-loans-service';

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'Se produjo un error al ejecutar la operación'
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Se produjo un error al ejecutar la operación';
};

export function useSaveLoanTypeMutation(): UseMutationResult<
  LoanType,
  unknown,
  LoanTypeMutation
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => loanTypesService.save(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loanTypes'] });
      toast({
        title: variables.id ? 'Tipo de préstamo actualizado' : 'Tipo de préstamo creado',
        description: variables.id
          ? 'Los datos del tipo de préstamo se actualizaron correctamente.'
          : 'El tipo de préstamo fue creado correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteLoanTypeMutation(): UseMutationResult<
  { message: string },
  unknown,
  number
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id) => loanTypesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loanTypes'] });
      toast({
        title: 'Tipo de préstamo eliminado',
        description: 'El tipo de préstamo fue eliminado correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });
}