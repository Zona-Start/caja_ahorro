import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { individualLoadService } from '../services/individual-load-service';
import type { LoadAssest } from '../schemas/individual-load-schema';

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
      individualLoadService.saveIndividualLoad(loadAssest),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.individualLoad.all(),
      });
    },
  });
}

export function useBulkUploadIndividualLoad(
  onSuccess?: (data: { message: string; processedCount: number }) => void
): UseMutationResult<unknown, Error, FormData, unknown> {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (formData: FormData) =>
      individualLoadService.bulkUpload(formData),
    onSuccess: (response: unknown) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.individualLoad.all(),
      });
      if (response) {
        onSuccess?.(response as { message: string; processedCount: number });
      }
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error({
        title: 'Error de carga',
        description: err?.message || 'Error en la carga masiva de haberes.',
      });
    },
  });
}

export function useDownloadTemplateIndividualLoad(): UseMutationResult<
  string,
  Error,
  void,
  unknown
> {
  const toast = useToastSystem();

  return useMutation({
    mutationFn: () => individualLoadService.downloadTemplate(),
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
        a.download = 'carga_masiva_haberes.xlsx';
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