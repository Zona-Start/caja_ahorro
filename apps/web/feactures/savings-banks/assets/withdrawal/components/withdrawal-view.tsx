'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import {
  SystemConfigState,
  useSystemConfigStore,
} from '@/store/SystemConfigStore';
import { Toaster } from '@repo/shadcn/toaster';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useWithdrawalMutation } from '../hooks/use-withdrawal-mutation';
import { useWithdrawalStore } from '../store/withdrawalStore';
import { WithdrawalForm } from './withdrawal-form';
import { WithdrawalSearch } from './withdrawal-search';
import { WithdrawalSummary } from './withdrawal-summary';

interface LoanViewProps {
  isEdit?: boolean;
  initialData?: any;
}

export function WithdrawalView({ isEdit = false, initialData }: LoanViewProps) {
  // Zustand store
  const {
    selectedAssociate,
    setSelectedAssociate,
    shouldClearSearch,
    setShouldClearSearch,
    withdrawalSummary,
    setselectedWithdrawlType,
    setWithdrawalSummary,
    formValues,
    setFormValues,
  } = useWithdrawalStore();

  // Local state
  const [isEditActive, setIsEditActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stickyTop, setStickyTop] = useState(4);
  const [currentCurrencyCode, setCurrentCurrencyCode] = useState<string>();
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>();

  const toast = useToastSystem();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: saveWithdrawal } = useWithdrawalMutation();

  // Refs
  const searchRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);

  // Valores iniciales del formulario
  const emptyFormValues = {
    id: 0,
    associateAccountId: 0,
    withdrawalDate: new Date(),
    withdrawalTypeId: 0,
    requestedAmount: '',
    paymentMethod: 'BANK_TRANSFER',
  };

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
    saveWithdrawal(data, {
      onSuccess: () => {
        toast.success({
          title: 'Retiro creado con éxito',
          description: `Se ha registrado un pago de retiro de  ${currentCurrencyCode === 'VES' ? 'Bs ' : '$ '} ${data.requestedAmount} para ${selectedAssociate?.fullname}.`,
        });
        queryClient.removeQueries({
          queryKey: ['withdrawal-associate', selectedAssociate?.cedula],
        });
        queryClient.removeQueries({
          queryKey: ['withdrawal-type'],
        });
        queryClient.removeQueries({
          queryKey: ['withdrawal-associate', ''],
        });
        queryClient.invalidateQueries({
          queryKey: ['withdrawal'],
        });
        handleCancel();
      },
    });
  };

  // Reset de todo el estado y navegación
  const handleCancel = async () => {
    setSelectedAssociate(null);
    setIsEditActive(false);
    setIsSubmitting(false);
    setShouldClearSearch(false);
    setWithdrawalSummary(null);
    setFormValues(emptyFormValues);
    setselectedWithdrawlType(null);

    router.push('/dashboard/haberes/retiros');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEdit ? 'Actualización de Retiro' : 'Creación Retiro'}
        </h1>
        <p className="text-muted-foreground">
          Complete el formulario para{' '}
          {isEdit ? 'actualizar un retiro' : 'crear un nuevo retiro'} haberes
          para un asociado
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div ref={searchRef} className="mb-6">
            <WithdrawalSearch
              currentCurrencyCode={currentCurrencyCode}
              currentExchangeRate={currentExchangeRate}
              isEdit={isEditActive}
            />
          </div>
          <div ref={formRef}>
            <WithdrawalForm
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
            <WithdrawalSummary
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
