'use client';

import { useToast } from '@repo/shadcn/hooks/use-toast';
import { Toaster } from '@repo/shadcn/toaster';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCreateLoanDisbursementBatchMutation } from '../hooks/use-loan-disbursement-batch-mutation';
import { CreateLoanDisbursementBatch } from '../schemas/loan-disbursement/batch.schema';
import { useLoanDisbursementBatchStore } from '../store/loanDisbursementBatchStore';
import { LoanDisbursementBatchForm } from './loan-disbursement/batch-form';
// Removed: import { LoanDisbursementBatchSummary } from './loan-disbursement/batch-summary';

interface LoanDisbursementBatchViewProps {
  isEdit?: boolean;
  initialData?: any;
}

export function LoanDisbursementBatchView({
  isEdit = false,
  initialData,
}: LoanDisbursementBatchViewProps) {
  const {
    selectedLoanDisbursementBatch,
    setSelectedLoanDisbursementBatch,
    clearAllLoanDisbursementBatchData,
  } = useLoanDisbursementBatchStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: createLoanDisbursementBatch } = useCreateLoanDisbursementBatchMutation();

  const handleSubmit = async (data: CreateLoanDisbursementBatch) => {
    setIsSubmitting(true);
    createLoanDisbursementBatch(data, {
      onSuccess: () => {
        toast({
          title: 'Lote de pago creado con éxito',
          description: 'El lote de pago ha sido registrado exitosamente.',
        });
        queryClient.invalidateQueries({ queryKey: ['loan-disbursement-batches'] });
        handleCancel();
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Error al crear el lote de pago',
          description:
            error.message ||
            'Ocurrió un error al procesar la operación. Intente nuevamente.',
        });
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  };

  const handleCancel = () => {
    clearAllLoanDisbursementBatchData();
    router.push('/dashboard/haberes/desembolsos-asociados');
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
          {' '}
          {/* Changed to lg:col-span-3 as summary is removed */}
          <LoanDisbursementBatchForm
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={initialData}
            isEdit={isEdit}
          />
        </div>
        {/* Removed: Summary section */}
      </div>
      <Toaster />
    </div>
  );
}
