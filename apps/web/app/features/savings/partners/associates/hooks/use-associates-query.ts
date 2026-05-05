import { useMutation, useQuery, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { associatesService } from '../services/associates-service';
import { QUERY_KEYS } from '@/lib/query-keys';
import { type AssociatesMutate } from '../schemas/associates.schema';
import { type AssociatesResponseAllSchema, type AssociatesResponseOneSchema } from '../schemas/associates-response-api';
import { z } from 'zod';

type AssociatesListResponse = z.infer<typeof AssociatesResponseAllSchema>;
type AssociateOneResponse = z.infer<typeof AssociatesResponseOneSchema>;

export function useAssociatesQuery(filters: Record<string, any>): UseQueryResult<AssociatesListResponse> {
  return useQuery({
    queryKey: QUERY_KEYS.associates.list(filters),
    queryFn: () => associatesService.getAll(filters),
  });
}

export function useAssociateQuery(id: number | string): UseQueryResult<AssociateOneResponse> {
  return useQuery({
    queryKey: QUERY_KEYS.associates.detail(id),
    queryFn: () => associatesService.getById(id),
    enabled: !!id,
  });
}

export function useAssociateMutation(): UseMutationResult<AssociateOneResponse, Error, AssociatesMutate> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssociatesMutate) => 
      data.id ? associatesService.update(data) : associatesService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.associates.lists() });
      if (response.data.id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.associates.detail(response.data.id) });
      }
      toast.success(response.message || 'Asociado guardado correctamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al guardar el asociado');
    },
  });
}

export function useDeleteAssociateMutation(): UseMutationResult<any, Error, number | string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => associatesService.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.associates.lists() });
      toast.success(response.message || 'Asociado eliminado correctamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al eliminar el asociado');
    },
  });
}

export function useBulkUploadAssociatesMutation(): UseMutationResult<any, Error, FormData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => associatesService.bulkUpload(formData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.associates.lists() });
      toast.success(response.message || 'Carga masiva completada');
    },
    onError: (error) => {
      toast.error(error.message || 'Error en la carga masiva');
    },
  });
}

export function useExportAssociatesMutation(): UseMutationResult<any, Error, any> {
  return useMutation({
    mutationFn: (params: any) => associatesService.exportPdf(params),
    onSuccess: (data) => {
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'asociados.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Reporte exportado correctamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al exportar el reporte');
    },
  });
}

export function useDownloadTemplateAssociateMutation(): UseMutationResult<any, Error, void> {
  return useMutation({
    mutationFn: () => associatesService.downloadTemplate(),
    onSuccess: (data) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_asociados.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Plantilla descargada correctamente');
    },
    onError: (error) => {
      toast.error(error.message || 'Error al descargar la plantilla');
    },
  });
}
