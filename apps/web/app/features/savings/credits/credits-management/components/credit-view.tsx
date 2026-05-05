'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import {
  SystemConfigState,
  useSystemConfigStore,
} from '@/store/SystemConfigStore';
import { Toaster } from '@repo/shadcn/toaster';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTypeCreditById } from '../type-credits/hooks/use-type-credits-query';
import { useCreateCreditManagementMutation } from '../hooks/use-credits-management-mutation';
import { type CreditManagement } from '../schemas/credits-management.schema';
import { CreditForm } from './credit-form';
import { CreditSearch } from './credit-search';
import { CreditSummary } from './credit-summary';

interface CreditViewProps {
  isEdit?: boolean;
  initialData?: any;
}

export function CreditView({ isEdit = false, initialData }: CreditViewProps) {
  const toast = useToastSystem();
  const navigate = useNavigate();
  const [isEditActive] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAssociate, setSelectedAssociate] = useState<any>(null);
  const [shouldClearSearch, setShouldClearSearch] = useState(false);
  const [creditSummary, setCreditSummary] = useState<{
    totalQuota: string;
    totalInterest: string;
    totalPayable: string;
    installmentAmount: string;
    totalAvailable: string;
  } | null>(null);
  
  const [selectedCreditType, setSelectedCreditType] = useState<any | null>(null);
  const [currentCurrencyCode, setCurrentCurrencyCode] = useState<string>();
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>();

  const queryClient = useQueryClient();
  const { mutate: saveCredit, isPending: isSaving } = useCreateCreditManagementMutation();
  const { data: creditTypeData } = useTypeCreditById(selectedCreditType?.id || 0, { enabled: !!selectedCreditType });

  useEffect(() => {
    const getCurrentCurrencyCode = (state: SystemConfigState) => {
      const currentSystemConfig = state.generalConfig.find((config) => config.key === 'MONEDA');
      const today = new Date().toISOString().split('T')[0];
      const exchangeRateData = state.exchangeRates?.find((entry) => {
        const entryDate = new Date(entry.date).toISOString().split('T')[0];
        return entryDate === today;
      });
      if (exchangeRateData) setCurrentExchangeRate(exchangeRateData.rate);
      const currentSystemValue = currentSystemConfig?.value;
      if (currentSystemValue && state.currencies) {
        const currentCurrency = state.currencies.find((currency) => currency.id === Number(currentSystemValue));
        return currentCurrency?.code;
      }
      return undefined;
    };
    setCurrentCurrencyCode(getCurrentCurrencyCode(useSystemConfigStore.getState()));
    const unsubscribe = useSystemConfigStore.subscribe((state) => {
      setCurrentCurrencyCode(getCurrentCurrencyCode(state));
    });
    return () => unsubscribe();
  }, []);

  const handleFormChange = useCallback((values: any) => {
    if (values.creditTypeId) {
      setSelectedCreditType({ id: Number(values.creditTypeId) });
    } else {
      setSelectedCreditType(null);
    }

    const amount = Number.parseFloat(values.requestedAmount || '0');
    const term = Number.parseInt(values.termUnits || '0');
    const rate = Number.parseFloat(values.interestRate || '0');
    const expenses = Number.parseFloat(values.expensesAmount || '0');

    if (amount > 0 && term > 0 && rate > 0) {
      const exchangeRate = Number(currentExchangeRate || 1);
      const val = currentCurrencyCode === 'USD' ? exchangeRate : 1;
      
      const totalInterest = (amount * rate) / 100;
      const installmentAmount = (amount * expenses) / 100;
      const totalPayable = amount + totalInterest;
      const totalAvailable = amount - installmentAmount;

      setCreditSummary({
        totalQuota: ((amount + totalInterest + installmentAmount) / term / val).toFixed(2),
        totalInterest: (totalInterest / val).toFixed(2),
        installmentAmount: (installmentAmount / val).toFixed(2),
        totalPayable: (totalPayable / val).toFixed(2),
        totalAvailable: (totalAvailable / val).toFixed(2),
      });
    } else {
      setCreditSummary(null);
    }
  }, [currentCurrencyCode, currentExchangeRate]);

  const handleSubmit = async (data: CreditManagement) => {
    setIsSubmitting(true);
    saveCredit(data, {
      onSuccess: () => {
        toast.success('Crédito procesado exitosamente');
        handleCancel();
      },
      onSettled: () => setIsSubmitting(false),
    });
  };

  const handleCancel = () => {
    navigate('/dashboard/caja-ahorro/creditos/gestion');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEdit ? 'Actualización de Crédito' : 'Creación de Crédito'}
        </h1>
        <p className="text-muted-foreground">
          Complete el formulario para {isEdit ? 'actualizar' : 'crear'} un crédito para un asociado
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <CreditSearch
              selectedAssociate={selectedAssociate}
              onSelectAssociate={setSelectedAssociate}
            />
          </div>
          <div>
            <CreditForm
              selectedAssociate={selectedAssociate}
              isSubmitting={isSubmitting || isSaving}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loanSummary={creditSummary}
              onFormChange={handleFormChange}
              currentCurrencyCode={currentCurrencyCode}
              currentExchangeRate={currentExchangeRate}
            />
          </div>
        </div>
        <div className="relative lg:col-span-1">
          <div className="sticky top-24">
            <CreditSummary
              selectedAssociate={selectedAssociate}
              selectedLoanType={creditTypeData}
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
