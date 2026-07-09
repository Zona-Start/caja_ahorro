'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { useNavigate } from 'react-router';
import { useState } from 'react';
import { useCreateCreditPaymentMutation } from '../hooks/use-credits-paid-mutation';
import { useCreditsPaidStore } from '../store/credits-paid-store';
import { CreditPaidForm } from './credit-paid-form';
import { CreditPaidSearch } from './credit-paid-search';
import { CreditPaidSummary } from './credit-paid-summary';

export function CreditPaidView() {
  const toast = useToastSystem();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    selectedAssociate,
    setSelectedAssociate,
    clearAllCreditData,
  } = useCreditsPaidStore();

  const { mutate: savePayment, isPending: isSaving } =
    useCreateCreditPaymentMutation();

  const handleSubmit = (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    savePayment(
      {
        ...data,
        creditId: selectedAssociate?.creditId ?? '',
      },
      {
        onSuccess: () => {
          toast.success('Pago registrado exitosamente');
          clearAllCreditData();
          handleCancel();
        },
        onSettled: () => setIsSubmitting(false),
      },
    );
  };

  const handleCancel = () => {
    navigate('/dashboard/caja-ahorro/pagos-creditos');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Registro de Pago de Crédito
        </h1>
        <p className="text-muted-foreground">
          Complete el formulario para registrar un pago de crédito de un asociado
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <CreditPaidSearch
              selectedAssociate={selectedAssociate}
              onSelectAssociate={setSelectedAssociate}
            />
          </div>
          <div>
            <CreditPaidForm
              selectedAssociate={selectedAssociate}
              isSubmitting={isSubmitting || isSaving}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </div>
        <div className="relative lg:col-span-1">
          <div className="sticky top-24">
            <CreditPaidSummary selectedAssociate={selectedAssociate} />
          </div>
        </div>
      </div>
    </div>
  );
}
