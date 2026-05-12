'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { useSystemConfigStore } from '@/stores/system-config.store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type SystemConfigState } from '@/stores/system-config.store';
import { loansManagementService } from '../services/loans-management-service';
import { loansManagementKeys } from '../keys/loans-management-keys';
import { type AssociatesLoan } from '../schemas/individual-loan-api-schema';
import { useLoanManagementStore } from '../store/loan-management.store';
import { useCreateLoansManagementMutation } from '../hooks/use-loans-management-mutation';
import { loanTypesService } from '../../type-loans/services/type-loans-service';
import { LoanForm } from './loan-form';
import { LoanSearch } from './loan-search';
import { LoanSummary } from './loan-summary';

interface LoanViewProps {
  isEdit?: boolean;
  initialData?: Record<string, unknown>;
}

export function LoanView({ isEdit = false, initialData }: LoanViewProps) {
  const toast = useToastSystem();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    selectedAssociate,
    shouldClearSearch,
    loanSummary,
    formValues,
    setSelectedAssociate,
    setShouldClearSearch,
    setLoanSummary,
    setFormValues,
    clearAllLoanData,
  } = useLoanManagementStore();

  const [isEditActive, setIsEditActive] = useState(false);
  const [selectedLoanType, setSelectedLoanType] = useState<{
    id: number;
    name: string;
    interestRate: number;
    termUnits: number;
    administrativeExpensePercentage: number;
  } | null>(null);
  const [stickyTop, setStickyTop] = useState(4);

  const [currentCurrencyCode, setCurrentCurrencyCode] = useState<
    string | undefined
  >(undefined);
  const [currentExchangeRate, setCurrentExchangeRate] = useState<
    number | undefined
  >(undefined);

  const { data: loanTypesData } = useQuery({
    queryKey: ['loanTypes', 'all'],
    queryFn: () =>
      loanTypesService.getAll({ page: 1, limit: 100, sortBy: 'id', sortOrder: 'asc' }),
    staleTime: 5 * 60 * 1000,
  });

  const { mutate: saveLoan, isPending: isSaving } =
    useCreateLoansManagementMutation();

  useEffect(() => {
    if (isEdit && initialData && Object.keys(initialData).length > 0) {
      const data = initialData as Record<string, unknown>;
      setSelectedAssociate({
        associate: {
          id: data.associateId as number,
          fullname: (data.associateFullname as string) ?? '',
          cedula: (data.associateCedula as string) ?? '',
          phone: (data.associatePhone as string) ?? null,
          email: (data.associateEmail as string) ?? null,
          isPayrollCredit: (data.associateIsPayrollCredit as boolean) ?? false,
          accountNumber: (data.associateAccountNumber as string) ?? '',
          associateAccountId: (data.associateAccountId as number) ?? 0,
          balance: (data.associateBalance as string) ?? '0',
          dateAdmission: (data.associateDateAdmission as string) ?? '',
        },
        totalLoans: (data.totalLoans as number) ?? 0,
        totalCredits: (data.totalCredits as number) ?? 0,
      });

      setIsEditActive(true);
      setFormValues({
        id: data.id,
        creditTypeId: data.loanTypeId ?? '',
        creditModality: data.loanModality ?? '',
        requestDate: data.requestDate ? new Date(data.requestDate as string) : new Date(),
        requestedAmount: data.requestedAmount ?? '',
        startDate: data.startDate ? new Date(data.startDate as string) : new Date(),
        endDate: data.endDate ?? '',
        termUnits: data.termMonths ?? '',
        termType: (data.termType as string) ?? 'Plazos',
        status: data.status ?? 'REQUESTED',
        paymentMethod: data.paymentMethod ?? '',
        disbursementAccountId: data.disbursementAccountId ?? '',
        interestRate: data.interestRate ?? '',
        expensesAmount: data.expensesAmount ?? '',
        overdraftAmount: data.overdraftAmount ?? null,
        notes: data.notes ?? '',
      });
    }
  }, [initialData, isEdit, setSelectedAssociate, setFormValues]);

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

      if (exchangeRateData) {
        setCurrentExchangeRate(exchangeRateData.rate);
      }

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

  const searchRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);

  const handleSelectAssociate = (associate: AssociatesLoan | null) => {
    setSelectedAssociate(associate);
  };

  const handleFormChange = useCallback(
    (values: Record<string, unknown>) => {
      if (values.creditTypeId) {
        const loanType = loanTypesData?.data?.find(
          (lt) => lt.id === Number(values.creditTypeId),
        );
        setSelectedLoanType(
          loanType
            ? {
                id: loanType.id,
                name: loanType.name,
                interestRate: loanType.interestRate,
                termUnits: loanType.termUnits,
                administrativeExpensePercentage:
                  loanType.administrativeExpensePercentage ?? 0,
              }
            : null,
        );
      } else {
        setSelectedLoanType(null);
      }

      const amount = Number.parseFloat(
        (values.requestedAmount as string) || '0',
      );
      const numInstallments = Number.parseInt(
        (values.termUnits as string) || '0',
      );
      const rate = Number.parseFloat(
        (values.interestRate as string) || '0',
      );
      const expensePct = Number.parseFloat(
        (values.expensesAmount as string) || '0',
      );
      const termType = values.termType as string;

      if (amount > 0 && numInstallments > 0 && rate > 0 && termType) {
        const periodsPerYear = termType === 'Plazos' ? 24 : 12;
        const r = rate / 100 / periodsPerYear;
        const n = numInstallments;
        const factor = Math.pow(1 + r, n);
        const frenchInstallment =
          (amount * r * factor) / (factor - 1);

        const totalInterestValue = frenchInstallment * n - amount;
        const expensesAmountValue = (amount * expensePct) / 100;
        const totalPayableValue =
          frenchInstallment * n + expensesAmountValue;
        const totalQuotaValue = frenchInstallment + expensesAmountValue / n;
        const totalDisbursementValue = amount;

        let totalQuota = totalQuotaValue;
        let totalInterest = totalInterestValue;
        let installmentAmount = expensesAmountValue;
        let totalPayable = totalPayableValue;
        let totalDisbursement = totalDisbursementValue;

        const exchangeRate = Number(currentExchangeRate);
        if (currentCurrencyCode === 'USD' && currentExchangeRate) {
          totalQuota /= exchangeRate;
          totalInterest /= exchangeRate;
          installmentAmount /= exchangeRate;
          totalPayable /= exchangeRate;
          totalDisbursement /= exchangeRate;
        }

        setLoanSummary({
          totalQuota: totalQuota.toFixed(2),
          totalInterest: totalInterest.toFixed(2),
          totalPayable: totalPayable.toFixed(2),
          installmentAmount: installmentAmount.toFixed(2),
          totalDisbursement: totalDisbursement.toFixed(2),
        });
      } else {
        setLoanSummary(null);
      }
    },
    [loanTypesData, currentCurrencyCode, currentExchangeRate, setLoanSummary],
  );

  const handleSubmit = async (data: Record<string, unknown>) => {
    saveLoan(data, {
      onSuccess: () => {
        toast.success({
          title: 'Préstamo creado con éxito',
          description: `Se ha registrado un préstamo para ${selectedAssociate?.associate.fullname}.`,
        });
        handleCancel();
      },
      onError: () => {
        toast.error({
          title: 'Error al crear préstamo',
          description:
            'Ocurrió un error al procesar la operación. Intente nuevamente.',
        });
      },
    });
  };

  const emptyFormValues: Record<string, unknown> = {
    id: '0',
    creditTypeId: '',
    creditModality: '',
    requestDate: new Date(),
    requestedAmount: '',
    startDate: new Date(),
    endDate: '',
    termUnits: '',
    termType: 'Plazos',
    status: 'REQUESTED',
    paymentMethod: '',
    disbursementAccountId: undefined,
    interestRate: '',
    expensesAmount: '',
    overdraftAmount: null,
    notes: '',
  };

  const handleCancel = async () => {
    clearAllLoanData();
    setIsEditActive(false);
    setSelectedLoanType(null);
    queryClient.removeQueries({
      queryKey: loansManagementKeys.all,
      exact: false,
    });
    queryClient.invalidateQueries({
      queryKey: loansManagementKeys.lists(),
    });
    navigate('/dashboard/prestamos/gestion');
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!searchRef.current || !formRef.current) return;

      const searchRect = searchRef.current.getBoundingClientRect();
      const formRect = formRef.current.getBoundingClientRect();
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;

      if (scrollingDown) {
        if (formRect.top <= 4) {
          setStickyTop(4);
        }
      } else {
        if (searchRect.bottom >= 4) {
          const newTop = Math.max(4, searchRect.top);
          setStickyTop(newTop);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEdit ? 'Actualización de Préstamo' : 'Creación de Préstamo'}
        </h1>
        <p className="text-muted-foreground">
          Complete el formulario para{' '}
          {isEdit ? 'actualizar un' : 'crear un nuevo'} préstamo para un
          asociado
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div ref={searchRef} className="mb-6">
            <LoanSearch
              shouldClearSearch={shouldClearSearch}
              onSelectAssociate={handleSelectAssociate}
              selectedAssociate={selectedAssociate}
              onClearSearch={() => setShouldClearSearch(false)}
              currentCurrencyCode={currentCurrencyCode}
              currentExchangeRate={currentExchangeRate}
              isEdit={isEditActive}
            />
          </div>

          <div ref={formRef}>
            <LoanForm
              selectedAssociate={selectedAssociate}
              isSubmitting={isSaving}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loanSummary={loanSummary}
              onFormChange={handleFormChange}
              currentCurrencyCode={currentCurrencyCode}
              currentExchangeRate={currentExchangeRate}
              initialData={isEditActive ? formValues : emptyFormValues}
              isEdit={isEditActive}
            />
          </div>
        </div>

        <div className="relative lg:col-span-1">
          <div
            className="sticky top-24 @5xl:col-span-4 @5xl:mt-0 @6xl:col-span-3 2xl:top-28"
            style={{ top: `${stickyTop}px` }}
          >
            <LoanSummary
              selectedAssociate={selectedAssociate}
              selectedLoanType={selectedLoanType}
              currentCurrencyCode={currentCurrencyCode}
              currentExchangeRate={currentExchangeRate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
