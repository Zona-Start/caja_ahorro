'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import { useToastSystem } from '@/hooks/use-toast-system';
import { formatCurrency } from '@/lib/formatCurrent';
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
import { useCallback, useEffect, useState } from 'react';
import { useAssociatesByCedula } from '../hooks/use-query-individual-withdrawal';
import { useWithdrawalStore } from '../store/withdrawalStore';
import { queryKeys } from '@/lib/queryKeys';

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
  if (lastOperationDate === null) return true;
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const lastOperationYear = lastOperationDate.getFullYear();
  const lastOperationMonth = lastOperationDate.getMonth();

  const monthDifference =
    (currentYear - lastOperationYear) * 12 +
    (currentMonth - lastOperationMonth);

  return monthDifference >= allowedMonths;
};

export function WithdrawalSearch({
  currentCurrencyCode,
  currentExchangeRate,
  isEdit = false,
}: WithdrawalSearchProps) {
  const toast = useToastSystem();
  const queryClient = useQueryClient();
  const { generalConfig } = useSystemConfigStore();
  
  const {
    selectedAssociate,
    setSelectedAssociate,
    shouldClearSearch,
    setShouldClearSearch,
    clearAllWithdrawalData,
    enabledTime,
    setEnabledTime,
  } = useWithdrawalStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState('');

  const {
    data: associateData,
    error,
    isError,
    isFetching,
    refetch,
  } = useAssociatesByCedula(submittedSearchTerm, {
    enabled: !!submittedSearchTerm.trim(),
    staleTime: 1000 * 60 * 5,
  });

  const clearAssociate = useCallback(() => {
    clearAllWithdrawalData();
    setSelectedAssociate(null);
    setSearchTerm('');
    setSubmittedSearchTerm('');
    setEnabledTime(true);
    queryClient.invalidateQueries({
      queryKey: queryKeys.associatesForWithdrawal._def,
    });
  }, [clearAllWithdrawalData, queryClient, setSelectedAssociate, setEnabledTime]);

  const handleSearch = useCallback(() => {
    const trimmedSearchTerm = searchTerm.trim();
    if (!trimmedSearchTerm) return;

    if (trimmedSearchTerm === submittedSearchTerm) {
      refetch();
    } else {
      setSelectedAssociate(null);
      setSubmittedSearchTerm(trimmedSearchTerm);
    }
  }, [searchTerm, submittedSearchTerm, refetch, setSelectedAssociate]);

  // Manejar resultados de búsqueda
  useEffect(() => {
    if (isFetching || !submittedSearchTerm) return;

    if (isError) {
      setSelectedAssociate(null);
      const errorMessage = (error as any)?.message || '';
      const status = (error as any)?.response?.status;

      if (errorMessage.includes('not found') || status === 404) {
        toast.info({
          title: 'Asociado no encontrado',
          description: `No se encontró un asociado con la cédula ${submittedSearchTerm}.`,
        });
      } else {
        toast.error({
          title: 'Error en la búsqueda',
          description: 'No se pudo obtener la información del asociado.',
        });
      }
      setSubmittedSearchTerm('');
      return;
    }

    if (associateData && submittedSearchTerm === associateData.cedula) {
      if (
        ['APPROVED', 'REQUESTED', 'PENDING_DISBURSEMENT_BANK_BATCH'].includes(
          associateData.withdrawalStatus ?? '',
        )
      ) {
        toast.warning({
          title: `Retiro pendiente`,
          description: `El asociado ${associateData.fullname} ya tiene un proceso de retiro en curso (${associateData.withdrawalStatus || 'PENDIENTE'}).`,
        });
        clearAssociate();
      } else if (associateData.withdrawalStatus === 'DISBURSED') {
        const timeConfig = generalConfig.find((item) => item.key === 'TIEMPO_RETIRO');
        const lastDate = associateData.withdrawalDate ? new Date(associateData.withdrawalDate) : null;
        const isAllowed = hasElapsedMonths(new Date(), Number(timeConfig?.value || 6), lastDate);
        
        setEnabledTime(isAllowed);
        if (!isAllowed) {
          toast.warning({
            title: `Restricción de tiempo`,
            description: `Debe transcurrir al menos ${timeConfig?.value || 6} meses desde el último retiro.`,
          });
          clearAssociate();
        } else {
          setSelectedAssociate(associateData);
        }
      } else {
        setSelectedAssociate(associateData);
      }
      setSubmittedSearchTerm('');
    }
  }, [associateData, error, isError, isFetching, submittedSearchTerm, generalConfig, setSelectedAssociate, setEnabledTime, clearAssociate, toast]);

  // Limpiar búsqueda desde el store
  useEffect(() => {
    if (shouldClearSearch) {
      setSearchTerm('');
      setSubmittedSearchTerm('');
      setSelectedAssociate(null);
      setEnabledTime(true);
      setShouldClearSearch(false);
    }
  }, [shouldClearSearch, setShouldClearSearch, setSelectedAssociate, setEnabledTime]);

  // Tecla Enter
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.key === 'Enter' &&
        document.activeElement === document.getElementById('associate-search')
      ) {
        e.preventDefault();
        handleSearch();
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [handleSearch]);

  const formatBalance = () => {
    if (selectedAssociate?.balance !== undefined && currentCurrencyCode) {
      const balance = Number(selectedAssociate.balance);
      if (currentCurrencyCode === 'USD' && currentExchangeRate) {
        return (balance / Number(currentExchangeRate)).toFixed(2);
      }
      return formatCurrency(balance, (currentCurrencyCode as any) || 'VES');
    }
    return '';
  };

  const hasBlocks = 
    selectedAssociate?.totalLoansAssociate !== 0 ||
    selectedAssociate?.totalCreditsAssociate !== 0 ||
    !!selectedAssociate?.isPayrollCredit;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWrapper className="w-8 h-8">
            <User />
          </IconWrapper>
          {isEdit ? 'Datos del Asociado' : 'Búsqueda de Asociado'}
        </CardTitle>
        {!isEdit && (
          <CardDescription>
            Busque y seleccione el asociado para el pago del retiro
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
                  disabled={isFetching}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={!searchTerm.trim() || isFetching}
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Buscar</span>
              </Button>
            </div>
          )}

          {isFetching && !selectedAssociate && (
            <div className="rounded-lg border border-dashed p-8 text-center mt-4">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="h-8 w-8 mb-2 animate-spin" />
                <p>Buscando asociado...</p>
              </div>
            </div>
          )}

          {!isFetching && selectedAssociate && (
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
                    disabled={isFetching}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Separator className="my-3" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Saldo Actual:</span>
                <span className="font-bold text-lg text-green-600">
                  {formatBalance()}
                </span>
              </div>
              
              {hasBlocks && (
                <div className="flex items-center justify-center mt-4">
                  <Badge className="text-white text-lg bg-red-500 hover:bg-red-600">
                    {selectedAssociate?.isPayrollCredit
                      ? 'Alerta!! posee un credinómina activo'
                      : 'Bloqueado, posee un préstamo o crédito pendiente'}
                  </Badge>
                </div>
              )}

              {!enabledTime && (
                <div className="flex items-center justify-center mt-4">
                  <Badge className="text-white text-lg bg-red-500 hover:bg-red-600">
                    Bloqueado, tiene menos de 6 meses desde el último retiro
                  </Badge>
                </div>
              )}
            </div>
          )}

          {!isFetching && !selectedAssociate && (
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
