import { QUERY_KEYS } from '@/lib/query-keys';
import { toast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';
import {
  type AssociatesResponseAllSchema,
  type AssociatesResponseOneSchema,
} from '../schemas/associates-response-api';
import { type AssociatesMutate } from '../schemas/associates.schema';
import { associatesService } from '../services/associates-service';

type AssociatesListResponse = z.infer<typeof AssociatesResponseAllSchema>;
type AssociateOneResponse = z.infer<typeof AssociatesResponseOneSchema>;

export function useAssociatesQuery(
  filters: Record<string, any>,
): UseQueryResult<AssociatesListResponse> {
  return useQuery({
    queryKey: QUERY_KEYS.associates.list(filters),
    queryFn: () => associatesService.getAll(filters),
  });
}

export function useAssociateQuery(
  id: number | string,
): UseQueryResult<AssociateOneResponse> {
  return useQuery({
    queryKey: QUERY_KEYS.associates.detail(id),
    queryFn: () => associatesService.getById(id),
    enabled: !!id,
  });
}

export function useAssociateMutation(): UseMutationResult<
  AssociateOneResponse,
  Error,
  AssociatesMutate
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AssociatesMutate) =>
      data.id ? associatesService.update(data) : associatesService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.associates.lists(),
      });
      if (response.data.id) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.associates.detail(response.data.id),
        });
      }
      toast({
        title: 'Operación exitosa',
        description: 'Los datos del Asociado se guardaron correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error en la Operación',
        description: 'Ocurrio un erro al guardar la información.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAssociateMutation(): UseMutationResult<
  any,
  Error,
  number | string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => associatesService.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.associates.lists(),
      });
      toast({
        title: 'Operación exitosa',
        description: 'Los datos del Asociado se eliminaron correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error en la Operación',
        description: 'Ocurrio un erro al eliminar el Asociado.',
        variant: 'destructive',
      });
    },
  });
}

export function useInactiveAssociateMutation(): UseMutationResult<
  any,
  Error,
  number | string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => associatesService.inactive(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.associates.lists(),
      });
      toast({
        title: 'Operación exitosa',
        description: 'El asociado fue inactivado correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error en la Operación',
        description: 'Ocurrio un erro al inactivar el Asociado.',
        variant: 'destructive',
      });
    },
  });
}

export function useBulkUploadAssociatesMutation(): UseMutationResult<
  any,
  Error,
  FormData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => associatesService.bulkUpload(formData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.associates.lists(),
      });
      toast({
        title: 'Operación exitosa',
        description:
          'Los datos masivos de los Asociados se guardaron correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error en la Operación',
        description:
          'Ocurrio un erro al cargar los datos masivos del Asociado.',
        variant: 'destructive',
      });
    },
  });
}

export function useExportAssociatesMutation(): UseMutationResult<
  any,
  Error,
  any
> {
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
      toast({
        title: 'Operación exitosa',
        description: 'El reporte fue exportado correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error en la Operación',
        description: 'Ocurrio un erro al exportar el reporte.',
        variant: 'destructive',
      });
    },
  });
}

export function useDownloadTemplateAssociateMutation(): UseMutationResult<
  any,
  Error,
  void
> {
  return useMutation({
    mutationFn: () => associatesService.downloadTemplate(),
    onSuccess: (data) => {
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_asociados.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({
        title: 'Operación exitosa',
        description: 'La plantilla fue descargada correctamente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error en la Operación',
        description: 'Ocurrio un erro al descargar la plantilla.',
        variant: 'destructive',
      });
    },
  });
}
