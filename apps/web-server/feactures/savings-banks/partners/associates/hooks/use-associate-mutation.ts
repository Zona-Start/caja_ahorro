'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bulkUploadAssociatesAction,
  deleteAssociatesAction,
  downloadAssociatesTemplateAction,
  exportAssociatesPdfAction,
  saveAssociateAction,
} from '../actions/associates-actions';

import { AssociatesMutate } from '../schemas/associates.schema';

// Mutation hook para crear/actualizar asociado individualmente
export function useAssociateMutation() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  const mutation = useMutation({
    mutationFn: (associatesMutate: AssociatesMutate) =>
      saveAssociateAction(associatesMutate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.associates.all() });
      toast.success('Asociado guardado exitosamente');
    },
    onError: () => {
      toast.error('Error al guardar el asociado');
    },
  });

  return mutation;
}

export function useDeleteAssociate() {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (id: number) => deleteAssociatesAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.associates.all() });
      toast.success('Asociado eliminado exitosamente');
    },
    onError: (error) => {
      if (error instanceof Error) {
        if (
          error.message ===
          'The partner cannot be deleted because there are transactions in their account other than the opening transaction.'
        ) {
          toast.error(
            'No se puede eliminar el asociado posee movimientos en su cuenta',
          );
        } else if (
          error.message ===
          'You cannot delete a retired or archived partner because they are part of your history.'
        ) {
          toast.error(
            'No se puede eliminar asociado retirado o archivado porque es parte del histórico.',
          );
        } else {
          toast.error('Error al inhabilitar el asociado');
        }
      }
    },
  });
}

// Mutation hook para carga masiva desde Excel
export function useBulkUploadAssociate(
  onSuccess?: (data: {
    total: number;
    inserted: number;
    skipped: number;
  }) => void,
) {
  const queryClient = useQueryClient();
  const toast = useToastSystem();

  return useMutation({
    mutationFn: (formData: FormData) => bulkUploadAssociatesAction(formData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.associates.all() });
      if (response?.data) {
        onSuccess?.(response.data);
      }
    },
    onError: () => {
      toast.error(
        'Error en la carga masiva. Por favor, contacte al administrador.',
      );
    },
  });
}

// Mutation hook para descargar el template Excel
export function useDownloadTemplateAssociate() {
  const toast = useToastSystem();

  return useMutation({
    mutationFn: () => downloadAssociatesTemplateAction(),
    onSuccess: (base64: string) => {
      // Decode based64 to Blob and trigger download
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
        a.download = 'carga_asociados.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        toast.error(
          'Error al procesar el archivo. Por favor intente de nuevo.',
        );
      }
    },
    onError: () => {
      toast.error(
        'Error al descargar el template. Por favor, intente de nuevo.',
      );
    },
  });
}


export function useExportAssociates() {
  return useMutation({
    // La mutación llama a tu Server Action que devuelve el base64
    mutationFn: (params: any) => exportAssociatesPdfAction(params),
    
    onSuccess: (result) => {
      try {
        // 1. Convertimos el base64 de vuelta a un Blob
        // Usamos la data que viene del result de la mutation
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        // 2. Proceso de descarga (Solo ocurre en el cliente)
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `reporte_asociados_${Date.now()}.pdf`;
        
        document.body.appendChild(a);
        a.click();
        
        // Limpieza de memoria y DOM
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
      } catch (err) {
        console.error('Error al procesar el archivo PDF en el cliente:', err);
      }
    },
    onError: (error) => {
      console.error('Export Mutation Error:', error);
    },
  });
}
