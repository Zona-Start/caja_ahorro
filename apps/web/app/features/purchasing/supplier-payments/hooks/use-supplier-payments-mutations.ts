import { QUERY_KEYS } from '@/lib/query-keys';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type {
  SupplierPaymentPay,
  SupplierPaymentAdvance,
  SupplierPaymentReverse,
} from '../schemas/supplier-payment.schema';
import type { SupplierPaymentApi } from '../schemas/supplier-payment-api.schema';
import { supplierPaymentsService } from '../services/supplier-payments-service';

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

export function useSupplierPaymentPayMutation(): UseMutationResult<
  SupplierPaymentApi,
  unknown,
  SupplierPaymentPay
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => supplierPaymentsService.pay(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supplierPayments.all });
      toast({
        title: 'Pago registrado',
        description: 'El pago al proveedor fue registrado correctamente.',
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

export function useSupplierPaymentPayAdvanceMutation(): UseMutationResult<
  SupplierPaymentApi,
  unknown,
  SupplierPaymentAdvance
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => supplierPaymentsService.payAdvance(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supplierPayments.all });
      toast({
        title: 'Anticipo registrado',
        description: 'El anticipo al proveedor fue registrado correctamente.',
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

export function useSupplierPaymentReverseMutation(): UseMutationResult<
  { message?: string; data: SupplierPaymentApi },
  unknown,
  SupplierPaymentReverse
> {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload) => supplierPaymentsService.reverse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supplierPayments.all });
      toast({
        title: 'Pago reversado',
        description: 'El pago fue reversado correctamente.',
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
