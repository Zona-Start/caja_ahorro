'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLoansPaidStore } from '../store/loans-paid-store';
import { useCreateLoanPaymentMutation } from '../hooks/use-loans-paid-mutation';
import { LoanPaidForm } from './loan-paid-form';
import { LoanPaidSearch } from './loan-paid-search';
import { LoanPaidSummary } from './loan-paid-summary';
import { type LoanPayment } from '../schemas/loans-paid.schema';

interface LoanPaidViewProps {
  isEdit?: boolean;
  initialData?: Partial<LoanPayment>;
}

export function LoanPaidView({
  isEdit = false,
  initialData,
}: LoanPaidViewProps) {
  const {
    selectedAssociate,
    formValues,
    setFormValues,
    clearAllLoanData,
  } = useLoansPaidStore();

  const [currentCurrencyCode] = useState<string>('VES');

  const navigate = useNavigate();
  const { mutate: savePayment, isPending: isSubmitting } =
    useCreateLoanPaymentMutation();

  const emptyFormValues: Partial<LoanPayment> = {
    creditId: 0,
    paymentDate: new Date(),
    paymentType: 'REGULAR',
    amount: '',
    bankId: 0,
    paymentMethod: 'BANK_TRANSFER',
    transactionReference: '',
    comment: '',
  };

  useEffect(() => {
    return () => {
      clearAllLoanData();
    };
  }, [clearAllLoanData]);

  const handleSubmit = (data: LoanPayment) => {
    savePayment(data, {
      onSuccess: () => {
        handleCancel();
      },
    });
  };

  const handleCancel = () => {
    clearAllLoanData();
    navigate('/dashboard/caja-ahorro/pagos-prestamos');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEdit ? 'Actualización de Pago' : 'Creación de Pago de Préstamo'}
        </h1>
        <p className="text-muted-foreground">
          Complete el formulario para{' '}
          {isEdit ? 'actualizar un pago' : 'registrar un nuevo pago'} de
          préstamo para un asociado
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <LoanPaidSearch
              currentCurrencyCode={currentCurrencyCode}
              isEdit={isEdit}
            />
          </div>
          <div>
            <LoanPaidForm
              selectedAssociate={selectedAssociate}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              currentCurrencyCode={currentCurrencyCode}
              initialData={isEdit ? formValues : emptyFormValues}
              isEdit={isEdit}
            />
          </div>
        </div>
        <div className="relative lg:col-span-1">
          <div className="sticky top-24 @5xl:col-span-4 @5xl:mt-0 @6xl:col-span-3 2xl:top-28">
            <LoanPaidSummary currentCurrencyCode={currentCurrencyCode} />
          </div>
        </div>
      </div>
    </div>
  );
}
