import { QUERY_KEYS } from '@/lib/query-keys';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { SupplierInvoiceMutation } from '../schemas/supplier-invoice.schema';
import type { CreditNoteForm, DebitNoteForm } from '../schemas/supplier-invoice.schema';
import type { SupplierInvoiceApi } from '../schemas/supplier-invoice-api.schema';
import { supplierInvoicesService } from '../services/supplier-invoices-service';

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

export function useSaveSupplierInvoiceMutation(): UseMutationResult<
  SupplierInvoiceApi,
  unknown,
  SupplierInvoiceMutation & { id?: number }
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => supplierInvoicesService.save(payload),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supplierInvoices.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supplierInvoices.detail(result.id) });
      toast({
        title: variables.id ? 'Factura actualizada' : 'Factura creada',
        description: variables.id
          ? 'La factura de proveedor fue actualizada correctamente.'
          : 'La factura de proveedor fue creada correctamente.',
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

export function useDeleteSupplierInvoiceMutation(): UseMutationResult<
  { message: string },
  unknown,
  number
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id) => supplierInvoicesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supplierInvoices.all });
      toast({
        title: 'Factura eliminada',
        description: 'La factura de proveedor fue eliminada correctamente.',
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

export function useCreateCreditNoteMutation(): UseMutationResult<
  any,
  unknown,
  CreditNoteForm
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => supplierInvoicesService.createCreditNote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supplierInvoices.all });
      toast({
        title: 'Nota de crédito creada',
        description: 'La nota de crédito fue registrada correctamente.',
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

export function useCreateDebitNoteMutation(): UseMutationResult<
  any,
  unknown,
  DebitNoteForm
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => supplierInvoicesService.createDebitNote(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supplierInvoices.all });
      toast({
        title: 'Nota de débito creada',
        description: 'La nota de débito fue registrada correctamente.',
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
