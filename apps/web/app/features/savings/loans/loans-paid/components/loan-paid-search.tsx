'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, User, X } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Badge } from '@repo/shadcn/badge';
import { Separator } from '@repo/shadcn/separator';
import { Input } from '@repo/shadcn/input';
import { formatCurrency } from '@/lib/format-utils';
import { QUERY_KEYS } from '@/lib/query-keys';
import { useLoansPaidStore } from '../store/loans-paid-store';
import { useAssociatesLoanSearchQuery } from '../hooks/use-loans-paid-search-query';

interface LoanPaidSearchProps {
  currentCurrencyCode?: string;
  isEdit?: boolean;
}

export function LoanPaidSearch({
  currentCurrencyCode = 'VES',
  isEdit = false,
}: LoanPaidSearchProps) {
  const queryClient = useQueryClient();

  const {
    selectedAssociate,
    setSelectedAssociate,
    shouldClearSearch,
    setShouldClearSearch,
    clearAllLoanData,
    setLoanSummary,
  } = useLoansPaidStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState('');

  const {
    data: associateData,
    error,
    isError,
    isFetching,
    refetch,
  } = useAssociatesLoanSearchQuery(submittedSearchTerm, {
    enabled: !!submittedSearchTerm.trim(),
  });

  const clearAssociate = useCallback(() => {
    clearAllLoanData();
    setSearchTerm('');
    setSubmittedSearchTerm('');
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.loansPaid.all(),
    });
  }, [clearAllLoanData, queryClient]);

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

  useEffect(() => {
    if (isFetching || !submittedSearchTerm) return;

    if (isError) {
      setSelectedAssociate(null);
      setSubmittedSearchTerm('');
      return;
    }

    if (associateData) {
      setSelectedAssociate(associateData);
      setLoanSummary({
        loanId: associateData.loanSummary.loanId,
        loanReference: associateData.loanSummary.loanReference,
        totalAmount: associateData.loanSummary.totalAmount,
        pendingBalance: associateData.loanSummary.pendingBalance,
        installmentsCount: associateData.loanSummary.installmentsCount,
        paidInstallments: associateData.loanSummary.paidInstallments,
        pendingInstallments: associateData.loanSummary.pendingInstallments,
      });
      setSubmittedSearchTerm('');
    }
  }, [
    associateData,
    error,
    isError,
    isFetching,
    submittedSearchTerm,
    setSelectedAssociate,
    setLoanSummary,
  ]);

  useEffect(() => {
    if (shouldClearSearch) {
      setSearchTerm('');
      setSubmittedSearchTerm('');
      setSelectedAssociate(null);
      setShouldClearSearch(false);
    }
  }, [shouldClearSearch, setShouldClearSearch, setSelectedAssociate]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (
        e.key === 'Enter' &&
        document.activeElement === document.getElementById('loan-paid-search')
      ) {
        e.preventDefault();
        handleSearch();
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [handleSearch]);

  const formatBalance = () => {
    if (selectedAssociate?.associate?.balance !== undefined) {
      const balance = Number(selectedAssociate.associate.balance);
      return formatCurrency(balance, (currentCurrencyCode as 'VES' | 'USD') || 'VES');
    }
    return '';
  };

  const hasBlocks =
    selectedAssociate?.associate.totalLoans > 0 ||
    selectedAssociate?.associate.totalCredits > 0 ||
    selectedAssociate?.associate.isPayrollCredit;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-8 h-8" />
          {isEdit ? 'Datos del Asociado' : 'Búsqueda de Asociado'}
        </CardTitle>
        {!isEdit && (
          <CardDescription>
            Busque y seleccione el asociado para registrar el pago del préstamo
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isEdit && (
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="loan-paid-search"
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

              <Separator className="my-3" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Préstamo:</span>
                <span className="font-medium">
                  {selectedAssociate.loanSummary.loanReference}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-medium">Saldo Pendiente:</span>
                <span className="font-bold text-lg text-red-600">
                  {formatCurrency(
                    Number(selectedAssociate.loanSummary.pendingBalance),
                    'VES'
                  )}
                </span>
              </div>

              {hasBlocks && (
                <div className="flex items-center justify-center mt-4">
                  <Badge className="text-white text-lg bg-destructive hover:bg-destructive/80">
                    {selectedAssociate.associate.isPayrollCredit
                      ? 'Alerta: posee un credinómina activo'
                      : 'Bloqueado: posee un préstamo o crédito pendiente'}
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
