'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import { toast } from '@/components/use-toast';
import { useSystemConfigStore } from '@/store/SystemConfigStore';
import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Badge } from '@repo/shadcn/components/ui/badge';
import { Separator } from '@repo/shadcn/components/ui/separator';
import { Input } from '@repo/shadcn/input';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, User, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react'; // Import useCallback
import { useAssociatesByCedula } from '../hooks/use-query-individual-withdrawal'; // Ajusta la ruta si es necesario
import { useWithdrawalStore } from '../store/withdrawalStore'; // Ajusta la ruta si es necesario

interface WithdrawalSearchProps {
  currentCurrencyCode: string | undefined;
  currentExchangeRate: number | undefined;
  isEdit?: boolean;
}

const hasElapsedMonths = (
  currentDate: Date,
  allowedMonths: number,
  lastOperationDate: Date | null,
): boolean => {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  if (lastOperationDate === null) {
    return true;
  }
  const lastOperationYear = lastOperationDate.getFullYear();
  const lastOperationMonth = lastOperationDate.getMonth();

  // Calculate the difference in months between the two dates
  const monthDifference =
    (currentYear - lastOperationYear) * 12 +
    (currentMonth - lastOperationMonth);

  // Check if the difference is greater than or equal to the allowed number of months
  return monthDifference >= allowedMonths;
};

export function WithdrawalSearch({
  currentCurrencyCode,
  currentExchangeRate,
  isEdit = false,
}: WithdrawalSearchProps) {
  const {
    selectedAssociate,
    setSelectedAssociate,
    shouldClearSearch,
    setShouldClearSearch,
    clearAllLoanData,
    enabledTime,
    setEnabledTime,
  } = useWithdrawalStore();

  const [searchTerm, setSearchTerm] = useState(''); // Controla el valor del input
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState(''); // Término enviado para la búsqueda

  const [shouldFetch, setShouldFetch] = useState(false); // Flag para iniciar la búsqueda
  const { generalConfig } = useSystemConfigStore();
  const queryClient = useQueryClient();

  const {
    data: associateData, // Renombrar para evitar conflicto con 'data' en useEffect
    error,
    isError,
    isLoading, // Usar isLoading directamente del hook
  } = useAssociatesByCedula(submittedSearchTerm, {
    enabled: shouldFetch && !!submittedSearchTerm.trim(), // Activar solo si shouldFetch es true y hay un término
  });

  // Efecto para manejar los resultados de la búsqueda y el estado post-búsqueda
  useEffect(() => {
    if (!shouldFetch && !submittedSearchTerm) {
      // No actuar si no se ha iniciado una búsqueda explícita y no estamos cargando.
      return;
    }

    if (isLoading) {
      // La búsqueda está en progreso.
      return;
    }

    // Si llegamos aquí, isLoading es false. La búsqueda ha terminado o no se ha iniciado una nueva válida.
    if (shouldFetch) {
      // Solo si *nosotros* activamos la búsqueda
      setShouldFetch(false); // Reseteamos nuestro flag, la query ya se ejecutó o falló.

      if (isError) {
        setSelectedAssociate(null);
        const errorMessage = (error as any)?.message || 'Error desconocido';
        const status = (error as any)?.response?.status;

        if (errorMessage.includes('not found') || status === 404) {
          toast({
            title: 'Asociado no encontrado',
            description: `No se encontró un asociado con la cédula ${submittedSearchTerm}.`,
          });
        } else if (errorMessage.includes('retired')) {
          toast({
            title: 'Asociado retirado',
            description:
              'el asociado está liquidado de la caja de ahorro y no puede ser seleccionado.',
          });
        } else if (errorMessage.includes('inactive')) {
          toast({
            title: `Asociado inactivo`,
            description:
              'el asociado está inactivo y no puede ser seleccionado.',
          });
        } else {
          toast({
            title: 'Error realizando la búsqueda',
            description: 'Conctate con el administrador del sistema.',
          });
        }
      } else if (associateData) {
        if (
          associateData.withdrawalStatus === 'APPROVED' ||
          associateData.withdrawalStatus === 'REQUESTED' ||
          associateData.withdrawalStatus === 'PENDING_DISBURSEMENT_BANK_BATCH'
        ) {
          toast({
            title: `No se puede realizar retiros para ${associateData.fullname}`,
            description: `Debe desembolsar el ultimo retiro realizado`,
          });
          clearAssociate();
        } else if (associateData.withdrawalStatus === 'DISBURSED') {
          const findTime = generalConfig.filter(
            (item) => item.key === 'tiempo_retiro',
          );

          const withdrawalDate = associateData?.withdrawalDate
            ? new Date(associateData.withdrawalDate)
            : null;
          const BlockedTime = hasElapsedMonths(
            new Date(),
            Number(findTime[0]?.value),
            withdrawalDate,
          );
          //setEnabledTime(BlockedTime);
          if (!BlockedTime) {
            toast({
              title: `No se puede realizar retiros para ${associateData.fullname}`,
              description: `Tiene menos de 6 meses último retiro`,
            });
            clearAssociate();
          } else {
            setSelectedAssociate(associateData);
          }
        } else {
          setSelectedAssociate(associateData);
        }
      } else if (submittedSearchTerm && !associateData) {
        // La búsqueda fue "exitosa" (sin error de red/servidor) pero no devolvió datos
        setSelectedAssociate(null);
        setEnabledTime(true);
        toast({
          title: 'Información no disponible',
          description: `No se encontró información para la cédula ${submittedSearchTerm}.`,
        });
      }
    }
  }, [
    associateData,
    error,
    isError,
    isLoading,
    setSelectedAssociate,
    submittedSearchTerm,
    shouldFetch,
  ]);

  // Efecto para limpiar el input y la selección cuando shouldClearSearch (del store) es true
  useEffect(() => {
    if (shouldClearSearch) {
      setSearchTerm('');
      setSubmittedSearchTerm('');
      setSelectedAssociate(null);
      setEnabledTime(true);
      // Resetea el flag en el store para evitar bucles.
      if (typeof setShouldClearSearch === 'function') {
        setShouldClearSearch(false);
      }
      // Opcional: Limpiar caché aquí también si es necesario,
      // aunque clearAssociate se encarga de ello al ser llamado.
      // queryClient.removeQueries({ queryKey: ['associates-by-cedula'] });
    }
  }, [
    shouldClearSearch,
    setShouldClearSearch,
    setSelectedAssociate,
    queryClient,
  ]);

  const handleSearch = useCallback(() => {
    const trimmedSearchTerm = searchTerm.trim();
    if (!trimmedSearchTerm) {
      toast({
        title: 'Campo vacío',
        description: 'Por favor, ingrese una cédula para buscar.',
      });
      return;
    }
    // Previene búsquedas repetidas con el mismo término si ya hay un resultado
    if (trimmedSearchTerm === submittedSearchTerm && selectedAssociate) {
      toast({
        title: 'Información ya cargada',
        description: `Ya se muestran los datos para la cédula ${trimmedSearchTerm}.`,
      });
      return;
    }

    setSubmittedSearchTerm(trimmedSearchTerm);
    setShouldFetch(true); // Activa la ejecución del hook
  }, [
    searchTerm,
    submittedSearchTerm,
    selectedAssociate,
    setSelectedAssociate,
  ]);

  const clearAssociate = useCallback(() => {
    clearAllLoanData();
    setSelectedAssociate(null);
    setSearchTerm('');
    setSubmittedSearchTerm('');
    setShouldFetch(false);
    setEnabledTime(true);
    queryClient.removeQueries({
      queryKey: ['withdrawal-associate-individual'],
      exact: true,
    });
  }, [
    clearAllLoanData,
    queryClient,
    setSelectedAssociate,
    setShouldClearSearch, // Si es parte de la lógica de `useLoansPaidStore`
  ]);

  // Efecto para manejar la tecla Enter en la búsqueda
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.key === 'Enter' &&
        document.activeElement === document.getElementById('associate-search')
      ) {
        e.preventDefault(); // Previene submit de formulario si está dentro de uno
        handleSearch();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [handleSearch]); // handleSearch está memoizado con useCallback

  const formatBalance = () => {
    if (selectedAssociate?.balance !== undefined && currentCurrencyCode) {
      if (currentCurrencyCode === 'USD' && currentExchangeRate) {
        const balance = Number(selectedAssociate.balance);
        const exchangeRate = Number(currentExchangeRate);
        const convertedBalance = balance / exchangeRate;
        return convertedBalance.toFixed(2);
      }
      return selectedAssociate.balance;
    }
    return '';
  };

  const hasBlocks =
    selectedAssociate?.totalLoansAssociate !== 0
      ? true
      : selectedAssociate?.totalCreditsAssociate !== 0
        ? true
        : selectedAssociate?.isPayrollCredit
          ? true
          : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWrapper color="blue" className="w-8 h-8">
            <User />
          </IconWrapper>
          {isEdit ? 'Datos del Asociado' : 'Busqueda de Asociado'}
        </CardTitle>
        {!isEdit && (
          <CardDescription>
            Busque y seleccione el asociado para el pago del préstamo
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isEdit && (
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="associate-search"
                  placeholder="Buscar por cédula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isLoading} // Deshabilitar mientras carga
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={!searchTerm.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Buscar</span>
              </Button>
            </div>
          )}

          {/* Visualización del asociado seleccionado o estado vacío/carga */}
          {isLoading &&
            !selectedAssociate && ( // Mostrar solo si estamos cargando y no hay un asociado previo
              <div className="rounded-lg border border-dashed p-8 text-center mt-4">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 mb-2 animate-spin" />
                  <p>Buscando asociado...</p>
                </div>
              </div>
            )}

          {!isLoading && selectedAssociate && (
            <div className="rounded-lg border p-4 mt-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col items-start">
                  <h3 className="font-medium text-lg">
                    {selectedAssociate.fullname}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedAssociate.cedula}
                  </p>
                  <div className="mt-2">
                    Cuenta: {selectedAssociate.accountNumber}
                  </div>
                </div>
                {!isEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearAssociate}
                    disabled={isLoading} // Aunque isLoading debería ser false aquí
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Separator className="my-3" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Saldo Actual:</span>
                <span className="font-bold text-lg text-green-600">
                  {formatBalance()} {currentCurrencyCode}
                </span>
              </div>
              {hasBlocks && (
                <div className="flex items-center justify-center mt-4">
                  <Badge
                    className={`text-white text-lg bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700`}
                  >
                    Bloqueado{' '}
                    {selectedAssociate?.isPayrollCredit &&
                    selectedAssociate?.isPayrollCredit
                      ? 'posee un credinomina activo'
                      : 'posee un préstamo o crédito sin cancelar'}
                  </Badge>
                </div>
              )}

              {!enabledTime && (
                <div className="flex items-center justify-center mt-4">
                  <Badge
                    className={`text-white text-lg bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700`}
                  >
                    Bloqueado, Tiene menos de 6 meses último retiro
                  </Badge>
                </div>
              )}
            </div>
          )}

          {!isLoading && !selectedAssociate && (
            <div className="rounded-lg border border-dashed p-8 text-center mt-4">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <User className="h-8 w-8 mb-2" />
                <p>
                  {submittedSearchTerm
                    ? 'No se encontró el asociado o no hay datos.'
                    : 'Ningún asociado seleccionado'}
                </p>
                {!submittedSearchTerm && (
                  <p className="text-sm">
                    Busque y seleccione un asociado para continuar
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
