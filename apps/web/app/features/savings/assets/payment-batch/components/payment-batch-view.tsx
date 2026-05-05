'use client';

import { useToast } from '@repo/shadcn/hooks/use-toast';
import { Toaster } from '@repo/shadcn/toaster';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import { useCreatePaymentBatchMutation } from '../hooks/use-payment-batch-mutation';
import { type CreatePaymentBatch } from '../schemas/payment-batch-schema';
import { usePaymentBatchStore } from '../store/payment-batch-store';
import { PaymentBatchForm } from './payment-batch-form';

interface PaymentBatchViewProps {
  isEdit?: boolean;
  initialData?: any;
}

export function PaymentBatchView({
  isEdit = false,
  initialData,
}: PaymentBatchViewProps) {
  const { clearAllPaymentBatchData } = usePaymentBatchStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: createPaymentBatch } = useCreatePaymentBatchMutation();

  const handleSubmit = async (data: CreatePaymentBatch) => {
    setIsSubmitting(true);
    createPaymentBatch(data, {
      onSuccess: () => {
        toast({
          title: 'Lote de pago creado con éxito',
          description: 'El lote de pago ha sido registrado exitosamente.',
        });
        queryClient.invalidateQueries({ queryKey: ['payment-batches'] });
        handleCancel();
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Error al crear el lote de pago',
          description:
            (error as Error).message ||
            'Ocurrió un error al procesar la operación. Intente nuevamente.',
        });
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  };

  const handleCancel = () => {
    clearAllPaymentBatchData();
    navigate('/dashboard/caja-ahorro/desembolsos-asociados');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEdit ? 'Edición de Lote de Pago' : 'Creación de Lote de Pago'}
        </h1>
        <p className="text-muted-foreground">
          Complete el formulario para{' '}
          {isEdit ? 'editar un lote de pago' : 'crear un nuevo lote de pago'}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <PaymentBatchForm
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={initialData}
            isEdit={isEdit}
          />
        </div>
      </div>
      <Toaster />
    </div>
  );
}
