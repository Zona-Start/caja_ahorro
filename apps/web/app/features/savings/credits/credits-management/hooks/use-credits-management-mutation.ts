import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { creditManagementService } from '../services/credits-management-service';

export function useCreateCreditManagementMutation(): UseMutationResult<
  unknown,
  Error,
  unknown,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (creditManagement: unknown) =>
      creditManagementService.createCreditManagement(creditManagement),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['creditManagements'],
      });
      toast.success('Crédito creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el crédito');
    },
  });
}

export function useApproveCreditManagementMutation(): UseMutationResult<
  unknown,
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: string) =>
      creditManagementService.approveCreditManagement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['creditManagements'],
      });
      toast.success('Crédito aprobado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al aprobar el crédito');
    },
  });
}

export function useDeleteCreditManagementMutation(): UseMutationResult<
  unknown,
  Error,
  string,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: string) =>
      creditManagementService.deleteCreditManagement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['creditManagements'],
      });
      toast.success('Crédito eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el crédito');
    },
  });
}

export interface BulkCreditFailure {
  row: number;
  cedula: string;
  associateName: string | null;
  error: string;
}

export interface BulkCreditSuccess {
  row: number;
  cedula: string;
  associateName: string;
  reference: string;
}

export interface BulkCreditResult {
  message: string;
  totalRows: number;
  successCount: number;
  failureCount: number;
  successes: BulkCreditSuccess[];
  failures: BulkCreditFailure[];
}

export function useBulkUploadCredits(
  onSuccess?: (data: BulkCreditResult) => void,
): UseMutationResult<BulkCreditResult, Error, FormData, unknown> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation<BulkCreditResult, Error, FormData>({
    mutationFn: (formData: FormData) =>
      creditManagementService.bulkUpload(formData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ['creditManagements'],
      });
      if (response) onSuccess?.(response);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error en la carga masiva de créditos');
    },
  });
}

export function useDownloadCreditBulkTemplate(
  onSuccess?: () => void,
): UseMutationResult<string, Error, void, unknown> {
  const toast = useToastSystem();

  return useMutation<string, Error, void>({
    mutationFn: () => creditManagementService.downloadBulkTemplate(),
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
        a.download = 'plantilla_carga_masiva_creditos.xlsx';
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
