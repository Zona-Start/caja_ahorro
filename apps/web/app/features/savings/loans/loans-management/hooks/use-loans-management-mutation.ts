import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { loansManagementService } from '../services/loans-management-service';
import { loansManagementKeys } from '../keys/loans-management-keys';

export function useCreateLoansManagementMutation(): UseMutationResult<
  unknown,
  Error,
  unknown,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (payload: unknown) =>
      loansManagementService.createLoansManagement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: loansManagementKeys.lists(),
      });
      toast.success('Préstamo creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el préstamo');
    },
  });
}

export function useApproveLoansManagementMutation(): UseMutationResult<
  unknown,
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: string) =>
      loansManagementService.approveLoansManagement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: loansManagementKeys.lists(),
      });
      toast.success('Préstamo aprobado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al aprobar el préstamo');
    },
  });
}

export function useDeleteLoansManagementMutation(): UseMutationResult<
  unknown,
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: string) =>
      loansManagementService.deleteLoansManagement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: loansManagementKeys.lists(),
      });
      toast.success('Préstamo eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el préstamo');
    },
  });
}

export function useDisburseIndividualLoan(): UseMutationResult<
  unknown,
  Error,
  { loanId: string; bankAccountId: string; currencyCode: string; paymentMethod: string; disbursementDate: Date; bankReference?: string; description?: string },
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (payload: any) =>
      loansManagementService.disburseLoan(payload.loanId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: loansManagementKeys.lists(),
      });
      toast.success('Préstamo desembolsado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al desembolsar el préstamo');
    },
  });
}

export interface BulkLoanFailure {
  row: number;
  cedula: string;
  associateName: string | null;
  error: string;
}

export interface BulkLoanSuccess {
  row: number;
  cedula: string;
  associateName: string;
  reference: string;
}

export interface BulkLoanResult {
  message: string;
  totalRows: number;
  successCount: number;
  failureCount: number;
  successes: BulkLoanSuccess[];
  failures: BulkLoanFailure[];
}

export function useBulkUploadLoans(
  onSuccess?: (data: BulkLoanResult) => void,
): UseMutationResult<BulkLoanResult, Error, FormData, unknown> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation<BulkLoanResult, Error, FormData>({
    mutationFn: (formData: FormData) =>
      loansManagementService.bulkUpload(formData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: loansManagementKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: loansManagementKeys.count(),
      });
      if (response) onSuccess?.(response);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error en la carga masiva de préstamos');
    },
  });
}

export function useDownloadLoanBulkTemplate(
  onSuccess?: () => void,
): UseMutationResult<string, Error, void, unknown> {
  const toast = useToastSystem();

  return useMutation<string, Error, void>({
    mutationFn: () => loansManagementService.downloadBulkTemplate(),
    onSuccess: (base64) => {
      try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_carga_masiva_prestamos.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.success('Plantilla descargada');
        onSuccess?.();
      } catch {
        toast.error('No se pudo generar la plantilla');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al descargar la plantilla');
    },
  });
}
