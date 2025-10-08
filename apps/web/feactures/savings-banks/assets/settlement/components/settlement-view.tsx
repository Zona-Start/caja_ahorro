'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import {
  SystemConfigState,
  useSystemConfigStore,
} from '@/store/SystemConfigStore';
import { Toaster } from '@repo/shadcn/toaster';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSettlementMutation } from '../hooks/use-settlement-mutation';
import { Settlement } from '../schemas/settlement.schema';
import { useSettlementStore } from '../store/settlementStore';
import { SettlementForm } from './settlement-form';
import { SettlementSearch } from './settlement-search';
import { SettlementSummary } from './settlement-summary';

interface LoanViewProps {
  isEdit?: boolean;
  initialData?: any;
}

export function SettlementView({ isEdit = false, initialData }: LoanViewProps) {
  // Zustand store
  const {
    selectedAssociate,
    setSelectedAssociate,
    shouldClearSearch,
    setShouldClearSearch,
    withdrawalSummary,
    setWithdrawalSummary,
    formValues,
    setFormValues,
  } = useSettlementStore();

  // Local state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stickyTop, setStickyTop] = useState(4);
  const [currentCurrencyCode, setCurrentCurrencyCode] = useState<string>();
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>();

  const toast = useToastSystem();
  const router = useRouter();
  const { mutate: saveSettlement } = useSettlementMutation();

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
  const handleSubmit = async (data: Settlement) => {
    setIsSubmitting(true);
    saveSettlement(data, {
      onSuccess: () => {
        toast.success({
          title: 'Solicitud de Liquidación procesada con éxito',
          description: `Se ha registrado la liquidación para ${selectedAssociate?.fullname}.`,
        });
        handleCancel();
      },
    });
  };

  // Reset de todo el estado y navegación
  const handleCancel = async () => {
    setSelectedAssociate(null);
    setIsSubmitting(false);
    setShouldClearSearch(false);
    setWithdrawalSummary(null);
    setFormValues(emptyFormValues);
    router.push('/dashboard/haberes/liquidacion');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Liquidación de Haberes
        </h1>
        <p className="text-muted-foreground">
          Complete el formulario para liquidar un asociado
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div ref={searchRef} className="mb-6">
            <SettlementSearch
              currentCurrencyCode={currentCurrencyCode}
              currentExchangeRate={currentExchangeRate}
            />
          </div>
          <div ref={formRef}>
            <SettlementForm
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              currentCurrencyCode={currentCurrencyCode}
              currentExchangeRate={currentExchangeRate}
            />
          </div>
        </div>
        <div className="relative lg:col-span-1">
          <div
            ref={summaryRef}
            className="sticky top-24  @5xl:col-span-4 @5xl:mt-0 @6xl:col-span-3 2xl:top-28"
            style={{ top: `${stickyTop}px` }}
          >
            <SettlementSummary
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
