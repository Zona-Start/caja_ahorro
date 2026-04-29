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
import { useTypeCredits } from '../../type-credits/hooks/use-query-type-credits';
import { TypesCredit } from '../../type-credits/schemas/type-credits-api.schema';
import { useCreditPaidMutation } from '../hooks/use-credits-paid-mutation';
import { useCreditPaidStore } from '../store/creditsPaidStore';
import { CreditPaidForm } from './credit-paid-form';
import { CreditPaidSearch } from './credit-paid-search';
import { CreditSummary } from './credit-paid-summary';

interface CreditViewProps {
  isEdit?: boolean;
  initialData?: any;
}

export function CreditPaidView({
  isEdit = false,
  initialData,
}: CreditViewProps) {
  const toast = useToastSystem();
  const {
    selectedAssociate,
    setSelectedAssociate,
    shouldClearSearch,
    setShouldClearSearch,
    creditSummary,
    setCreditSummary,
    formValues,
    setFormValues,
  } = useCreditPaidStore();

  // Local state
  const [isEditActive, setIsEditActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCreditType, setSelectedCreditType] =
    useState<TypesCredit | null>(null);
  const [stickyTop, setStickyTop] = useState(4);
  const [currentCurrencyCode, setCurrentCurrencyCode] = useState<string>();
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: creditTypes } = useTypeCredits();
  const { mutate: saveCreditPaid } = useCreditPaidMutation();

  // Refs
  const searchRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);

  // Valores iniciales del formulario
  const emptyFormValues = {
    id: '0',
    creditTypeId: '',
    creditModality: '',
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
  //       totalCredits: initialData?.totalCredits ?? 0,
  //     });
  //     setIsEditActive(true);
  //     setFormValues({
  //       id: initialData?.id,
  //       CreditTypeId: initialData?.CreditTypeId,
  //       CreditModality: initialData?.CreditModality,
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
    saveCreditPaid(data, {
      onSuccess: () => {
        toast.success({
          title: 'Pago de Crédito creado con éxito',
          description: `Se ha registrado un pago de crédito de  ${currentCurrencyCode === 'VES' ? 'Bs ' : '$ '} ${data.amount} para ${selectedAssociate?.fullname}.`,
        });

        queryClient.removeQueries({
          queryKey: queryKeys.associatesForCreditsPaid.byCedula(
            selectedAssociate?.cedula!,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.creditsPaid.list(),
        });
        queryClient.removeQueries({
          queryKey: queryKeys.associatesForCreditsPaid.all(),
        });
        handleCancel();
      },
      onError: () => {
        toast.error({
          title: 'Error al guardar el pago del crédito',
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
    setCreditSummary(null);
    setFormValues(emptyFormValues);
    setSelectedCreditType(null);

    router.push('/dashboard/creditos/pagos');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEdit ? 'Actualización de Pago de  Crédito' : 'Pagos de Crédito'}
        </h1>
        <p className="text-muted-foreground">
          Complete el formulario para{' '}
          {isEdit ? 'actualizar un pago de' : 'crear un nuevo pago de'} crédito
          para un asociado
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div ref={searchRef} className="mb-6">
            <CreditPaidSearch
              currentCurrencyCode={currentCurrencyCode}
              currentExchangeRate={currentExchangeRate}
              isEdit={isEditActive}
            />
          </div>
          <div ref={formRef}>
            <CreditPaidForm
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
            <CreditSummary
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
