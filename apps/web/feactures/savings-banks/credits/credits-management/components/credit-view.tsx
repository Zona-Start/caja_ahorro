'use client';

import {
  SystemConfigState,
  useSystemConfigStore,
} from '@/store/SystemConfigStore';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import { Toaster } from '@repo/shadcn/toaster';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTypeCredits } from '../../type-credits/hooks/use-query-type-credits';
import { TypesCredit } from '../../type-credits/schemas/type-credits-api.schema';
import { useCreditManagementMutation } from '../hooks/use-credits-management-mutation';
import { AssociatesLoan } from '../schemas/individual-credit-api-schema';
import { CreditForm } from './credit-form';
import { CreditSearch } from './credit-search';
import { CreditSummary } from './credit-summary';

interface CreditViewProps {
  isEdit?: boolean;
  initialData?: any;
}

export function CreditView({ isEdit = false, initialData }: CreditViewProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isEditActive, SetIsEditActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAssociate, setSelectedAssociate] =
    useState<AssociatesLoan | null>(null);
  const [shouldClearSearch, setShouldClearSearch] = useState(false); // Estado para limpiar el input

  const [creditSummary, setCreditSummary] = useState<{
    totalQuota: string;
    totalInterest: string;
    totalPayable: string;
    installmentAmount: string;
    totalAvailable: string;
  } | null>(null);
  const [formValues, setFormValues] = useState({});
  const [selectedCreditType, setSelectedCreditType] =
    useState<TypesCredit | null>(null);
  const [stickyTop, setStickyTop] = useState(4);

  const [currentCurrencyCode, setCurrentCurrencyCode] = useState<
    string | undefined
  >(undefined);
  const [currentExchangeRate, setCurrentExchangeRate] = useState<
    number | undefined
  >(undefined);
  const queryClient = useQueryClient(); // Get query client instance
  const { data: creditTypes } = useTypeCredits();
  const { mutate: saveLoan, isPending: isSaving } =
    useCreditManagementMutation();

  //efecto para pasar los datos iniciales modo edit
  useEffect(() => {
    if (
      isEdit &&
      initialData &&
      Object.keys(initialData).length > 0 // Solo si hay datos
    ) {
      setSelectedAssociate({
        associate: {
          id: initialData?.associateId,
          fullname: initialData?.associateFullname,
          cedula: initialData?.associateCedula,
          phone: initialData?.associatePhone,
          email: initialData?.associateEmail,
          isPayrollCredit: initialData?.associateIsPayrollCredit,
          accountNumber: initialData?.associateAccountNumber,
          associateAccountId: initialData?.associateAccountId,
          balance: initialData?.associateBalance,
          dateAdmission: initialData?.associateDateAdmission,
        },
        totalCredits: initialData?.totalCredits ?? 0,
      });

      SetIsEditActive(true);
      setFormValues({
        id: initialData?.id,
        creditTypeId: initialData?.creditTypeId,
        creditModality: initialData?.creditModality,
        requestDate: initialData?.requestDate,
        requestedAmount: initialData?.requestedAmount,
        startDate: initialData?.startDate,
        endDate: initialData?.endDate,
        termMonths: initialData?.termMonths,
        status: initialData?.status,
        interestRate: initialData?.interestRate,
        installmentsCount: initialData?.termMonths,
        expensesAmount: initialData?.expensesAmount,
        overdraftAmount: initialData?.overdraftAmount,
        notes: initialData?.notes,
        commercialHouseId: initialData?.commercialHouseId,
        invoiceNumber: initialData?.invoiceNumber,
      });
    }
  }, [initialData, isEdit]);

  // Efecto para obtener el código de la moneda actual desde el store
  useEffect(() => {
    const getCurrentCurrencyCode = (state: SystemConfigState) => {
      const currentSystemConfig = state.generalConfig.find(
        (config) => config.key === 'MONEDA',
      );

      const today = new Date().toISOString().split('T')[0]; // Obtiene la fecha actual en formato YYYY-MM-DD
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

    // Obtener el valor inicial
    setCurrentCurrencyCode(
      getCurrentCurrencyCode(useSystemConfigStore.getState()),
    );

    // Suscribirse a los cambios en el store
    const unsubscribe = useSystemConfigStore.subscribe((state) => {
      // Volver a calcular y actualizar el código de la moneda cuando el store cambia
      setCurrentCurrencyCode(getCurrentCurrencyCode(state));
    });

    // Limpiar la suscripción al desmontar el componente
    return () => unsubscribe();
  }, []); // Dependencias para que el efecto se ejecute cuando cambian

  // Referencias para los elementos DOM
  const searchRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef(0);

  // Función para manejar la selección de asociado
  const handleSelectAssociate = (associate: AssociatesLoan | null) => {
    setSelectedAssociate(associate);
  };

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
    interestRate: '',
    installmentsCount: '',
    expensesAmount: '',
    overdraftAmount: null,
    notes: '',
    commercialHouseId: '',
    invoiceNumber: '',
  };

  // Función para manejar cambios en el formulario
  const handleFormChange = useCallback(
    (values: any) => {
      // Calcular endDate sumando termMonths a startDate
      //setFormValues(values);
      // Actualizar el tipo de préstamo seleccionado
      if (values.creditTypeId) {
        const creditType = creditTypes?.data?.find(
          (lt) => lt.id === Number(values.creditTypeId),
        );
        setSelectedCreditType(creditType ?? null);
      } else {
        setSelectedCreditType(null);
      }

      // Calcular resumen del préstamo
      const amount = Number.parseFloat(values.requestedAmount || '0'); //monto soclitado
      const term = Number.parseInt(values.termMonths || '0'); //plazos
      const rate = Number.parseFloat(values.interestRate || '0'); //interes anuales
      const installments = Number.parseInt(values.installmentsCount || '0'); //cuotas
      const expenses = Number.parseFloat(values.expensesAmount || '0'); //porcentaje de gastos

      if (amount > 0 && term > 0 && rate > 0 && installments > 0) {
        // Cálculo simple de interés (en la práctica se usaría una fórmula más compleja)

        const percentageInterest = (amount * rate) / 100; // Porcentaje de cuota
        const percentageExpenses = (amount * expenses) / 100; // Porcentaje de gastos
        let totalQuota = 0;
        let totalInterest = 0;
        let installmentAmount = 0;
        let totalPayable = 0;
        let totalAvailable = 0;
        const exchangeRate = Number(currentExchangeRate);

        if (currentCurrencyCode === 'USD' && currentExchangeRate) {
          totalQuota =
            (amount + percentageInterest + percentageExpenses) /
            term /
            exchangeRate;
          totalInterest = (amount * rate) / 100 / exchangeRate;
          installmentAmount = (amount * expenses) / 100 / exchangeRate;
          totalPayable = (amount + totalInterest) / exchangeRate;
          totalAvailable = (amount - installmentAmount) / exchangeRate;
        } else {
          totalQuota =
            (amount + percentageInterest + percentageExpenses) / term;
          totalInterest = (amount * rate) / 100;
          installmentAmount = (amount * expenses) / 100;
          totalPayable = amount + totalInterest;
          totalAvailable = amount - installmentAmount;
        }

        setCreditSummary({
          totalQuota: totalQuota.toFixed(2),
          totalInterest: totalInterest.toFixed(2),
          totalPayable: totalPayable.toFixed(2),
          installmentAmount: installmentAmount.toFixed(2),
          totalAvailable: totalAvailable.toFixed(2),
        });
      } else {
        setCreditSummary(null);
      }
    },
    [creditTypes],
  );

  // Función para manejar el envío del formulario
  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    saveLoan(data, {
      onSuccess: () => {
        toast({
          title: `${isEdit ? 'Crédito actualizado' : 'Crédito creado'} con éxito`,
          description: `Se ha ${isEdit ? 'actualizado' : 'registrado'}  un crédito de  ${currentCurrencyCode === 'VES' ? 'Bs ' : '$ '} ${data.requestedAmount} para ${selectedAssociate?.associate.fullname}.`,
        });
        handleCancel();
      },
      onError: () => {
        toast({
          variant: 'destructive',
          title: 'Error en la operación',
          description:
            'Ocurrió un error al procesar la operación. Intente nuevamente.',
        });
      },
    });
  };

  const handleCancel = async () => {
    // Resetear el estado
    setSelectedAssociate(null);
    SetIsEditActive(false);
    setIsSubmitting(false);
    setShouldClearSearch(false);
    setCreditSummary(null);
    setFormValues(emptyFormValues);
    setSelectedCreditType(null);
    queryClient.removeQueries({ queryKey: ['associates-by-cedula'] });
    queryClient.removeQueries({ queryKey: ['credit-management-id'] });
    router.push('/dashboard/creditos/gestion');
  };

  // Efecto para manejar el scroll y ajustar la posición del componente sticky
  useEffect(() => {
    const handleScroll = () => {
      if (!searchRef.current || !formRef.current) return;

      const searchRect = searchRef.current.getBoundingClientRect();
      const formRect = formRef.current.getBoundingClientRect();
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;

      // Determinar la posición del sticky basado en la dirección del scroll
      if (scrollingDown) {
        // Cuando bajamos, alineamos con el formulario
        if (formRect.top <= 4) {
          setStickyTop(4);
        }
      } else {
        // Cuando subimos, alineamos con el search si está visible
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
          {isEdit ? 'Actualización de Crédito' : 'Creación de Crédito'}
        </h1>
        <p className="text-muted-foreground">
          Complete el formulario para{' '}
          {isEdit ? 'actualizar un' : 'crear un nuevo'} crédito para un asociado
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Contenedor para LoanSearch con ancho completo */}
          <div ref={searchRef} className="mb-6">
            <CreditSearch
              shouldClearSearch={shouldClearSearch}
              onSelectAssociate={handleSelectAssociate}
              selectedAssociate={selectedAssociate}
              onClearSearch={() => setShouldClearSearch(false)}
              currentCurrencyCode={currentCurrencyCode}
              currentExchangeRate={currentExchangeRate}
              isEdit={isEditActive}
            />
          </div>

          {/* Formulario de préstamo */}
          <div ref={formRef}>
            <CreditForm
              selectedAssociate={selectedAssociate}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loanSummary={creditSummary}
              onFormChange={handleFormChange}
              currentCurrencyCode={currentCurrencyCode}
              currentExchangeRate={currentExchangeRate}
              endDate={(formValues as any).endDate} // <-- Cast para evitar error de tipo
              initialData={isEditActive ? formValues : emptyFormValues}
              isEdit={isEditActive}
            />
          </div>
        </div>

        {/* Columna lateral con posición sticky */}
        <div className="relative lg:col-span-1">
          <div
            ref={summaryRef}
            className="sticky top-24  @5xl:col-span-4 @5xl:mt-0 @6xl:col-span-3 2xl:top-28"
            style={{ top: `${stickyTop}px` }}
          >
            <CreditSummary
              selectedAssociate={selectedAssociate}
              selectedLoanType={selectedCreditType}
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
