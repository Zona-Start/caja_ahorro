import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { 
  bulkUploadIndividualLoadAction, 
  downloadTemplateIndividualLoadAction, 
  saveIndividualLoadAction 
} from '../actions/individual-load.action';
import { LoadAssest } from '../schemas/individual-load-schema';

export function useIndividualLoadMutation(): UseMutationResult<
  string | undefined,
  Error,
  LoadAssest,
  unknown
> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (loadAssest: LoadAssest) =>
      saveIndividualLoadAction(loadAssest),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:[queryKeys.associatesForIndividualAssetLoad.all(),
          queryKeys.accountingEntries.all(),
        queryKeys.accountingReports.balanceSheet(),
        queryKeys.accountingReports.generalLedger(),
        queryKeys.accountingReports.incomeStatement(),
        queryKeys.accountingReports.journalBook(),
        queryKeys.accountingReports.trialBalance(),
        ] 
      });

      
    },
  });
}

// Mutation hook para carga masiva desde Excel
export function useBulkUploadIndividualLoad(
  onSuccess?: (data: { message: string; processedCount: number }) => void,
): UseMutationResult<any, Error, FormData, unknown> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (formData: FormData) => bulkUploadIndividualLoadAction(formData),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.associatesForIndividualAssetLoad.all(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.accountingEntries.all(),
      });
      if (response) {
        onSuccess?.(response);
      }
    },
    onError: (error: any) => {
      toast.error({
        title: 'Error de carga',
        description: error?.message || 'Error en la carga masiva de haberes.',
      });
    },
  });
}

// Mutation hook para descargar el template Excel
export function useDownloadTemplateIndividualLoad(): UseMutationResult<
  string,
  Error,
  void,
  unknown
> {
  const toast = useToastSystem();

  return useMutation({
    mutationFn: () => downloadTemplateIndividualLoadAction(),
    onSuccess: (base64: string) => {
      try {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_carga_masiva.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success({
          title: 'Plantilla descargada',
          description: 'El archivo Excel ha sido generado con éxito.',
        });
      } catch (err) {
        toast.error({
          title: 'Error',
          description:
            'Error al procesar el archivo. Por favor intente de nuevo.',
        });
      }
    },
    onError: () => {
      toast.error({
        title: 'Error',
        description:
          'Error al descargar el template. Por favor, intente de nuevo.',
      });
    },
  });
}
