'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import { useToastSystem } from '@/hooks/use-toast-system';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Input } from '@repo/shadcn/input';
import { Separator } from '@repo/shadcn/separator';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, User, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAssociatesByCedula } from '../hooks/use-credits-management-query';
import { type AssociatesLoan } from '../schemas/individual-credit-api-schema';

interface CreditSearchProps {
  onSelectAssociate: (associate: AssociatesLoan | null) => void;
  selectedAssociate: AssociatesLoan | null;
  currentCurrencyCode: string | undefined;
  currentExchangeRate: number | undefined;
  isEdit?: boolean;
}

export function CreditSearch({
  onSelectAssociate,
  selectedAssociate,
  currentCurrencyCode,
  currentExchangeRate,
  isEdit = false,
}: CreditSearchProps) {
  const toast = useToastSystem();
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);
  const queryClient = useQueryClient();

  const { data, error, isError, isLoading } = useAssociatesByCedula(
    submittedSearchTerm,
    {
      enabled: shouldFetch && !!submittedSearchTerm.trim(),
    },
  );

  useEffect(() => {
    if (!shouldFetch && !submittedSearchTerm) return;
    if (isLoading) return;

    if (shouldFetch) {
      setShouldFetch(false);

      if (isError) {
        onSelectAssociate(null);
        const errorMessage = (error as any)?.message || 'Error desconocido';
        const status = (error as any)?.response?.status;

        if (errorMessage.includes('not found') || status === 404) {
          toast.info({
            title: 'Asociado no encontrado',
            description: `No se encontró un asociado con la cédula ${submittedSearchTerm}.`,
          });
        } else {
          toast.error({
            title: 'Error realizando la búsqueda',
            description: 'Contáctese con el administrador del sistema.',
          });
        }
      } else if (data) {
        onSelectAssociate(data as AssociatesLoan);
      } else if (submittedSearchTerm && !data) {
        onSelectAssociate(null);
        toast.info({
          title: 'Información no disponible',
          description: `No se encontró información para la cédula ${submittedSearchTerm}.`,
        });
      }
    }
  }, [data, error, isError, isLoading, onSelectAssociate, submittedSearchTerm, shouldFetch]);

  const handleSearch = useCallback(() => {
    const trimmedSearchTerm = searchTerm.trim();
    if (!trimmedSearchTerm) {
      toast.warning({
        title: 'Campo vacío',
        description: 'Por favor, ingrese una cédula para buscar.',
      });
      return;
    }

    queryClient.removeQueries({
      queryKey: ['creditManagements', 'byCedula'],
      exact: false,
    });

    onSelectAssociate(null);
    setSubmittedSearchTerm(trimmedSearchTerm);
    setShouldFetch(true);
  }, [searchTerm, queryClient, onSelectAssociate]);

  const clearAssociate = useCallback(() => {
    onSelectAssociate(null);
    setSearchTerm('');
    setSubmittedSearchTerm('');
    setShouldFetch(false);
    queryClient.removeQueries({
      queryKey: ['creditManagements', 'byCedula'],
      exact: false,
    });
  }, [queryClient, onSelectAssociate]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.key === 'Enter' &&
        document.activeElement === document.getElementById('associate-search')
      ) {
        handleSearch();
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [handleSearch]);

  const formatBalance = () => {
    if (
      selectedAssociate?.associate?.balance !== undefined &&
      currentCurrencyCode
    ) {
      if (currentCurrencyCode === 'USD' && currentExchangeRate) {
        const balance = Number(selectedAssociate.associate.balance);
        const exchangeRate = Number(currentExchangeRate);
        const convertedBalance = balance / exchangeRate;
        return convertedBalance.toFixed(2);
      }
      return selectedAssociate.associate.balance;
    }
    return '';
  };

  const hasBlocks =
    selectedAssociate?.totalCredits !== 0 ||
    selectedAssociate?.totalLoans !== 0 ||
    selectedAssociate?.associate?.isPayrollCredit === true;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWrapper className="w-8 h-8">
            <User />
          </IconWrapper>
          {isEdit ? 'Datos del Asociado' : 'Selección de Asociado'}
        </CardTitle>
        <CardDescription>
          {!isEdit && 'Busque y seleccione el asociado para el crédito'}
        </CardDescription>
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
                  disabled={isLoading}
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

          {isLoading && !selectedAssociate && (
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
                    {selectedAssociate.associate.fullname}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedAssociate.associate.cedula}
                  </p>
                  <div className="mt-2">
                    Cuenta: {selectedAssociate.associate.accountNumber}
                  </div>
                </div>
                {!isEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearAssociate}
                    disabled={isLoading}
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
                  <Badge className="text-white text-lg bg-red-500 hover:bg-red-600">
                    Bloqueado{' '}
                    {selectedAssociate?.associate?.isPayrollCredit
                      ? 'posee un credinomina activo'
                      : selectedAssociate?.totalLoans
                        ? 'posee un prestamo sin cancelar'
                        : 'posee un crédito sin cancelar'}
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
