'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import { useToastSystem } from '@/hooks/use-toast-system';
import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Input } from '@repo/shadcn/input';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, User, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAssociatesByCedula } from '../hooks/use-settlement-query';
import { useSettlementStore } from '../store/settlement-store';

interface SettlementSearchProps {
  currentCurrencyCode: string | undefined;
  currentExchangeRate: number | undefined;
  isEdit?: boolean;
}

export function SettlementSearch({
  currentCurrencyCode,
  currentExchangeRate,
  isEdit = false,
}: SettlementSearchProps) {
  const toast = useToastSystem();
  const {
    selectedAssociate,
    setSelectedAssociate,
    shouldClearSearch,
    setShouldClearSearch,
    clearAllLoanData,
  } = useSettlementStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState('');

  const [shouldFetch, setShouldFetch] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: associateData,
    error,
    isError,
    isLoading,
  } = useAssociatesByCedula(submittedSearchTerm, {
    enabled: shouldFetch && !!submittedSearchTerm.trim(),
  });

  useEffect(() => {
    if (!shouldFetch && !submittedSearchTerm) return;

    if (isLoading) return;

    if (shouldFetch) {
      setShouldFetch(false);

      if (isError) {
        setSelectedAssociate(null);
        const errorMessage = (error as any)?.message || 'Error desconocido';
        const status = (error as any)?.response?.status;

        if (errorMessage.includes('not found') || status === 404) {
          toast.info({
            title: 'Asociado no encontrado',
            description: `No se encontró un asociado con la cédula ${submittedSearchTerm}.`,
          });
        } else if (errorMessage.includes('retired')) {
          toast.info({
            title: 'Asociado retirado',
            description:
              'el asociado está liquidado de la caja de ahorro y no puede ser seleccionado.',
          });
        } else if (errorMessage.includes('inactive')) {
          toast.warning({
            title: 'Asociado Inactivo',
            description:
              'el asociado tiene un estatus de inactivo y no puede ser seleccionado.',
          });
        } else if (errorMessage.includes('no liquidation data')) {
          toast.info({
            title: 'Asociado sin datos de liquidación',
            description:
              'el asociado no tiene datos para ser liquidado y no puede ser seleccionado.',
          });
        } else {
          toast.error({
            title: 'Error realizando la búsqueda',
            description: 'Contáctese con el administrador del sistema.',
          });
        }
      } else if (associateData) {
        setSelectedAssociate(associateData);
      } else if (submittedSearchTerm && !associateData) {
        setSelectedAssociate(null);
        toast.info({
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

  useEffect(() => {
    if (shouldClearSearch) {
      setSearchTerm('');
      setSubmittedSearchTerm('');
      setSelectedAssociate(null);
      if (typeof setShouldClearSearch === 'function') {
        setShouldClearSearch(false);
      }
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
      toast.warning({
        title: 'Campo vacío',
        description: 'Por favor, ingrese una cédula para buscar.',
      });
      return;
    }

    queryClient.removeQueries({
      queryKey: ['settlements', 'byCedula'],
      exact: false,
    });

    setSelectedAssociate(null);
    setSubmittedSearchTerm(trimmedSearchTerm);
    setShouldFetch(true);
  }, [searchTerm, queryClient, setSelectedAssociate]);

  const clearAssociate = useCallback(() => {
    clearAllLoanData();
    setSelectedAssociate(null);
    setSearchTerm('');
    setSubmittedSearchTerm('');
    setShouldFetch(false);
    queryClient.removeQueries({
      queryKey: ['settlements', 'byCedula'],
      exact: false,
    });
    queryClient.invalidateQueries({ queryKey: ['settlements'] });
  }, [clearAllLoanData, queryClient, setSelectedAssociate]);

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
            Busque y seleccione el asociado para realizar la liquidación
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
                    {(selectedAssociate as any).fullname}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {(selectedAssociate as any).cedula}
                  </p>
                  <div className="mt-2">
                    Cuenta: {(selectedAssociate as any).account_number}
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
