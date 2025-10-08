'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { queryKeys } from '@/lib/queryKeys';
import {
  SystemConfigState,
  useSystemConfigStore,
} from '@/store/SystemConfigStore';
import { Toaster } from '@repo/shadcn/toaster';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTypeLoans } from '../../type-loans/hooks/use-query-type-loans';
import { TypesLoan } from '../../type-loans/schemas/type-loans-api.schema';
import { useLoanPaidMutation } from '../hooks/use-loans-paid-mutation';
import { useLoansPaidStore } from '../store/loansPaidStore';
import { LoanPaidForm } from './loan-paid-form';
import { LoanPaidSearch } from './loan-paid-search';
import { LoanSummary } from './loan-paid-summary';

interface LoanViewProps {
  isEdit?: boolean;
  initialData?: any;
}

export function LoanPaidView({ isEdit = false, initialData }: LoanViewProps) {
  const toast = useToastSystem();
  const {
    selectedAssociate,
    setSelectedAssociate,
    shouldClearSearch,
    setShouldClearSearch,
    loanSummary,
    setLoanSummary,
    formValues,
    setFormValues,
  } = useLoansPaidStore();

  // Local state
  const [isEditActive, setIsEditActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLoanType, setSelectedLoanType] = useState<TypesLoan | null>(
    null,
  );
  const [stickyTop, setStickyTop] = useState(4);
  const [currentCurrencyCode, setCurrentCurrencyCode] = useState<string>();
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: loanTypes } = useTypeLoans();
  const { mutate: saveLoanPaid } = useLoanPaidMutation();

  // Refs
  const searchRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);

  // Valores iniciales del formulario
  const emptyFormValues = {
    id: '0',
    loanTypeId: '',
    loanModality: '',
    requestDate: new Date(),
    requestedAmount: '',
    startDate: new Date(),
    endDate: '',
    termMonths: '',
    status: 'REQUESTED',
    paymentMethod: '',
    disbursementAccountId: undefined,
    interestRate: '',
    installmentsCount: '',
    expensesAmount: '',
    overdraftAmount: null,
    notes: '',
  };

  // Cargar datos iniciales en modo edición
  // useEffect(() => {
  //   if (isEdit && initialData && Object.keys(initialData).length > 0) {
  //     setSelectedAssociate({
  //       associate: {
  //         id: initialData?.associateId,
  //         fullname: initialData?.associateFullname,
  //         cedula: initialData?.associateCedula,
  //         phone: initialData?.associatePhone,
  //         email: initialData?.associateEmail,
  //         isPayrollCredit: initialData?.associateIsPayrollCredit,
  //         accountNumber: initialData?.associateAccountNumber,
  //         associateAccountId: initialData?.associateAccountId,
  //         balance: initialData?.associateBalance,
  //         dateAdmission: initialData?.associateDateAdmission,
  //       },
  //       totalLoans: initialData?.totalLoans ?? 0,
  //     });
  //     setIsEditActive(true);
  //     setFormValues({
  //       id: initialData?.id,
  //       loanTypeId: initialData?.loanTypeId,
  //       loanModality: initialData?.loanModality,
  //       requestDate: initialData?.requestDate,
  //       requestedAmount: initialData?.requestedAmount,
  //       startDate: initialData?.startDate,
  //       endDate: initialData?.endDate,
  //       termMonths: initialData?.termMonths,
  //       status: initialData?.status,
  //       paymentMethod: initialData?.paymentMethod,
  //       disbursementAccountId: initialData?.disbursementAccountId,
  //       interestRate: initialData?.interestRate,
  //       installmentsCount: initialData?.termMonths,
  //       expensesAmount: initialData?.expensesAmount,
  //       overdraftAmount: initialData?.overdraftAmount,
  //       notes: initialData?.notes,
  //     });
  //   }
  // }, [initialData, isEdit, setFormValues, setSelectedAssociate]);

  // Obtener y actualizar moneda y tasa de cambio
  useEffect(() => {
    const getCurrentCurrencyCode = (state: SystemConfigState) => {
      const currentSystemConfig = state.generalConfig.find(
        (config) => config.key === 'MONEDA',
      );
      const today = new Date().toISOString().split('T')[0];
      const exchangeRateData = state.exchangeRates?.find((entry) => {
        const entryDate = new Date(entry.date).toISOString().split('T')[0];
        return entryDate === today;
      });
      if (exchangeRateData) setCurrentExchangeRate(exchangeRateData.rate);
      const currentSystemValue = currentSystemConfig?.value;
      if (currentSystemValue && state.currencies) {
        const currentCurrency = state.currencies.find(
          (currency) => currency.id === Number(currentSystemValue),
        );
        return currentCurrency?.code;
      }
      return undefined;
    };
    setCurrentCurrencyCode(
      getCurrentCurrencyCode(useSystemConfigStore.getState()),
    );
    const unsubscribe = useSystemConfigStore.subscribe((state) => {
      setCurrentCurrencyCode(getCurrentCurrencyCode(state));
    });
    return () => unsubscribe();
  }, []);

  // Envío del formulario
  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    saveLoanPaid(data, {
      onSuccess: () => {
        toast.success({
          title: 'Pago de Préstamo creado con éxito',
          description: `Se ha registrado un pago de préstamo de  ${currentCurrencyCode === 'VES' ? 'Bs ' : '$ '} ${data.amount} para ${selectedAssociate?.fullname}.`,
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.loansPaid.associateByIndividual(
            selectedAssociate?.cedula!,
          ),
        });

        queryClient.invalidateQueries({
          queryKey: queryKeys.loansPaid.all(),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.loansManagement.all(),
        });

        queryClient.invalidateQueries({
          queryKey: queryKeys.loansManagement.list(),
        });

        handleCancel();
      },
      onError: () => {
        toast.error({
          title: 'Error al guardar el pago del préstamo',
          description:
            'Ocurrió un error al procesar la operación. Intente nuevamente.',
        });
      },
    });
  };

  // Reset de todo el estado y navegación
  const handleCancel = async () => {
    setSelectedAssociate(null);
    setIsEditActive(false);
    setIsSubmitting(false);
    setShouldClearSearch(false);
    setLoanSummary(null);
    setFormValues(emptyFormValues);
    setSelectedLoanType(null);

    router.push('/dashboard/prestamos/pagos');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEdit ? 'Actualización de Pago de  Préstamo' : 'Pagos de Préstamo'}
        </h1>
        <p className="text-muted-foreground">
          Complete el formulario para{' '}
          {isEdit ? 'actualizar un pago de' : 'crear un nuevo pago de'} préstamo
          para un asociado
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div ref={searchRef} className="mb-6">
            <LoanPaidSearch
              currentCurrencyCode={currentCurrencyCode}
              currentExchangeRate={currentExchangeRate}
              isEdit={isEditActive}
            />
          </div>
          <div ref={formRef}>
            <LoanPaidForm
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              currentCurrencyCode={currentCurrencyCode}
              currentExchangeRate={currentExchangeRate}
              initialData={isEditActive ? formValues : emptyFormValues}
              isEdit={isEditActive}
            />
          </div>
        </div>
        <div className="relative lg:col-span-1">
          <div
            ref={summaryRef}
            className="sticky top-24  @5xl:col-span-4 @5xl:mt-0 @6xl:col-span-3 2xl:top-28"
            style={{ top: `${stickyTop}px` }}
          >
            <LoanSummary
              currentCurrencyCode={currentCurrencyCode}
              currentExchangeRate={currentExchangeRate}
            />
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
