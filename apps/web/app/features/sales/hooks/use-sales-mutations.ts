import { useToastSystem } from '@/hooks/use-toast-system';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { salesKeys } from '../keys/sales-keys';
import type {
  CreateSaleInput,
  Customer,
  CustomerPayload,
  PaymentForm,
} from '../schemas/sales.schema';
import { salesService } from '../services/sales-service';

function getErrorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    return message || error.message || 'Se produjo un error';
  }
  if (error instanceof Error) return error.message;
  return 'Se produjo un error';
}

export function useCreateCustomerMutation(): UseMutationResult<
  Customer,
  unknown,
  CustomerPayload
> {
  const queryClient = useQueryClient();
  const { success, error } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => salesService.createCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.customers.all() });
      success('Cliente registrado correctamente');
    },
    onError: (err) => error(getErrorMessage(err)),
  });
}

export function useUpdateCustomerMutation(): UseMutationResult<
  Customer,
  unknown,
  { id: string; payload: CustomerPayload }
> {
  const queryClient = useQueryClient();
  const { success, error } = useToastSystem();

  return useMutation({
    mutationFn: ({ id, payload }) => salesService.updateCustomer(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.customers.all() });
      success('Cliente actualizado correctamente');
    },
    onError: (err) => error(getErrorMessage(err)),
  });
}

export function useToggleCustomerMutation(): UseMutationResult<
  void,
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { success, error } = useToastSystem();

  return useMutation({
    mutationFn: (id) => salesService.toggleCustomerStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.customers.all() });
      success('Estado del cliente actualizado');
    },
    onError: (err) => error(getErrorMessage(err)),
  });
}

export function useCreateSaleMutation(): UseMutationResult<
  unknown,
  unknown,
  CreateSaleInput
> {
  const queryClient = useQueryClient();
  const { success, error } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => salesService.createSale(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.invoices.lists() });
      queryClient.invalidateQueries({ queryKey: salesKeys.receivables.lists() });
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      success('Venta registrada correctamente');
    },
    onError: (err) => error(getErrorMessage(err)),
  });
}

export function useCancelInvoiceMutation(): UseMutationResult<
  void,
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { success, error } = useToastSystem();

  return useMutation({
    mutationFn: (id) => salesService.cancelInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.invoices.lists() });
      success('Factura anulada correctamente');
    },
    onError: (err) => error(getErrorMessage(err)),
  });
}

export function useGenerateDeliveryNoteMutation(): UseMutationResult<
  void,
  unknown,
  string
> {
  const queryClient = useQueryClient();
  const { success, error } = useToastSystem();

  return useMutation({
    mutationFn: (id) => salesService.generateDeliveryNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: salesKeys.deliveryNotes.lists(),
      });
      success('Nota de entrega generada correctamente');
    },
    onError: (err) => error(getErrorMessage(err)),
  });
}

export function useCreatePaymentMutation(): UseMutationResult<
  void,
  unknown,
  { customerId: string; invoiceId: string } & PaymentForm
> {
  const queryClient = useQueryClient();
  const { success, error } = useToastSystem();

  return useMutation({
    mutationFn: (payload) => salesService.createPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.receivables.lists() });
      queryClient.invalidateQueries({ queryKey: salesKeys.invoices.lists() });
      success('Cobro registrado correctamente');
    },
    onError: (err) => error(getErrorMessage(err)),
  });
}
