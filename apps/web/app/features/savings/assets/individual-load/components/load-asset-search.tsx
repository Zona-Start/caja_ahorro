import { IconWrapper } from '@/components/icon-wrapper';
import { useToastSystem } from '@/hooks/use-toast-system';
import { formatCurrency } from '@/lib/format-utils';
import { QUERY_KEYS } from '@/lib/query-keys';
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
import { AlertCircle, Loader2, Search, User, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAssociatesByCedula } from '../hooks/use-individual-load-query';
import { useIndividualLoadStore } from '../store/individual-load-store';

export function LoadAssetsSearch() {
  const toast = useToastSystem();
  const queryClient = useQueryClient();
  const {
    selectedAssociate,
    setSelectedAssociate,
    searchQuery,
    setSearchQuery,
    setIsSearching,
    errors,
    setRestrictions,
    clearAll,
  } = useIndividualLoadStore();

  const [shouldFetch, setShouldFetch] = useState(false);
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState('');

  const { data, error, isLoading, isError } = useAssociatesByCedula(
    submittedSearchTerm,
    {
      enabled: shouldFetch && !!submittedSearchTerm.trim(),
      retry: false,
    }
  );

  useEffect(() => {
    setIsSearching(isLoading);
  }, [isLoading, setIsSearching]);

  useEffect(() => {
    if (!selectedAssociate && !shouldFetch) {
      setSubmittedSearchTerm('');
    }
  }, [selectedAssociate, shouldFetch]);

  useEffect(() => {
    if (shouldFetch && !isLoading) {
      setShouldFetch(false);

      if (isError) {
        const errorMessage =
          (error as { message?: string })?.message || '';

        if (errorMessage.toLowerCase().includes('not found')) {
          toast.info({
            title: 'Asociado no encontrado',
            description: `No se encontró un asociado con la cédula ${submittedSearchTerm}.`,
          });
        } else {
          setRestrictions([
            errorMessage ||
              'No se puede seleccionar este asociado debido a restricciones actuales.',
          ]);
          toast.error({
            title: 'Restricción del Asociado',
            description:
              errorMessage ||
              'Este asociado presenta restricciones para la carga de haberes.',
          });
        }
        setSelectedAssociate(null);
      } else if (data) {
        const dataTyped = data as { data?: { fullname: string; cedula: string; id: number; accountNumber: string; balance: number; associateAccountsId: number } };
        setSelectedAssociate(dataTyped.data ?? null);
        setRestrictions([]);
      }
    }
  }, [
    data,
    isError,
    error,
    isLoading,
    shouldFetch,
    setSelectedAssociate,
    setRestrictions,
    toast,
    submittedSearchTerm,
  ]);

  const handleSearch = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      toast.warning({
        title: 'Campo vacío',
        description: 'Ingrese una cédula para buscar.',
      });
      return;
    }

    queryClient.removeQueries({
      queryKey: QUERY_KEYS.individualLoad.all(),
    });

    setRestrictions([]);
    setSelectedAssociate(null);
    setSubmittedSearchTerm(trimmed);
    setShouldFetch(true);
  }, [searchQuery, queryClient, setSelectedAssociate, setRestrictions, toast]);

  const handleClear = useCallback(() => {
    clearAll();
    queryClient.removeQueries({
      queryKey: QUERY_KEYS.individualLoad.all(),
    });
    setSubmittedSearchTerm('');
  }, [clearAll, queryClient]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWrapper className="w-8 h-8">
            <User />
          </IconWrapper>
          Selección de Asociado
        </CardTitle>
        <CardDescription>
          Busque por cédula para cargar haberes individualmente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="associate-search-input"
                placeholder="Ingrese Cédula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Buscar</span>
            </Button>
          </div>

          {errors.length > 0 && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-3 text-destructive animate-in fade-in zoom-in duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Restricciones encontradas:</p>
                <ul className="list-disc list-inside mt-1">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {isLoading && !selectedAssociate && (
            <div className="rounded-lg border border-dashed p-10 text-center mt-4">
              <Loader2 className="h-8 w-8 m-auto animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">
                Validando asociado...
              </p>
            </div>
          )}

          {!isLoading && selectedAssociate && (
            <div className="rounded-lg border p-5 mt-4 bg-muted/30 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-xl">
                    {selectedAssociate.fullname}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Badge variant="outline">{selectedAssociate.cedula}</Badge>
                    <span className="text-xs uppercase font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                      ID: {selectedAssociate.id}
                    </span>
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Cuenta: {selectedAssociate.accountNumber}
                </div>

                <Separator />

                <div className="flex justify-between items-end pt-2">
                  <span className="text-sm text-muted-foreground">
                    Saldo Disponible
                  </span>
                  <div className="text-right">
                    <span className="text-2xl font-black tracking-tight text-primary">
                      {formatCurrency(Number(selectedAssociate.balance) || 0, 'VES')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !selectedAssociate && errors.length === 0 && (
            <div className="rounded-lg border border-dashed p-10 text-center mt-4">
              <User className="h-10 w-10 m-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                Ningún asociado seleccionado
              </p>
              <p className="text-xs text-muted-foreground/70">
                Ingrese la cédula para iniciar el proceso
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}