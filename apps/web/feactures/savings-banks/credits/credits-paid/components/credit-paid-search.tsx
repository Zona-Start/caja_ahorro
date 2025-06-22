'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import { toast } from '@/components/use-toast';
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
import { useCallback, useEffect, useState } from 'react'; // Import useCallback
import { useAssociatesByCedula } from '../hooks/use-query-individual-credit'; // Ajusta la ruta si es necesario
import { useCreditPaidStore } from '../store/creditsPaidStore'; // Ajusta la ruta si es necesario

interface CreditSearchProps {
  currentCurrencyCode: string | undefined;
  currentExchangeRate: number | undefined;
  isEdit?: boolean;
}

export function CreditPaidSearch({
  currentCurrencyCode,
  currentExchangeRate,
  isEdit = false,
}: CreditSearchProps) {
  const {
    selectedAssociate,
    setSelectedAssociate,
    shouldClearSearch,
    setShouldClearSearch,
    clearAllCreditData,
  } = useCreditPaidStore();

  const [searchTerm, setSearchTerm] = useState(''); // Controla el valor del input
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState(''); // Término enviado para la búsqueda
  const [shouldFetch, setShouldFetch] = useState(false); // Flag para iniciar la búsqueda

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
        } else if (errorMessage.includes('retired'))  {
            toast({
              title: 'Asociado retirado',
              description: 'el asociado está liquidado de la caja de ahorro y no puede ser seleccionado.',
            });
        } else if (errorMessage.includes('inactive'))  {
            toast({
              title: 'Asociado inactivo',
              description: 'el asociado está inactivo y no puede ser seleccionado.',
            });
        }  else {
          toast({
            title: 'Error realizando la búsqueda',
            description: 'Conctate con el administrador del sistema.',
          });
        }
      } else if (associateData) {
        console.log(associateData);

        if (associateData.creditTotalAmount === '0.00') {
          setSelectedAssociate(null);
          toast({
            title: 'Pago de créditos no disponibles',
            description: `El Asociado no tiene pagos de créditos pendientes`,
          });
        } else {
          setSelectedAssociate(associateData);
        }
      } else if (submittedSearchTerm && !associateData) {
        // La búsqueda fue "exitosa" (sin error de red/servidor) pero no devolvió datos
        setSelectedAssociate(null);
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
    clearAllCreditData();
    setSelectedAssociate(null);
    setSearchTerm('');

    setSubmittedSearchTerm('');
    setShouldFetch(false);

    queryClient.removeQueries({
        queryKey: ['credit-paid-associate-individual-by-cedula'],
      });
    // Considera remover también la genérica si tu lógica lo requiere
    // queryClient.removeQueries({ queryKey: ['associates-by-cedula'], exact: false });
  }, [
    clearAllCreditData,
    submittedSearchTerm, // Para `termToClear`
    queryClient,
    setSelectedAssociate,
    setShouldClearSearch, // Si es parte de la lógica de `useCreditsPaidStore`
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

  const couta =
    selectedAssociate?.creditAmortization?.[0]?.quotaStatus === 'PARTIAL'
      ? Number(selectedAssociate.creditAmortization[0].quotaAmount) -
        Number(selectedAssociate.creditAmortization[0].quotaPartial)
      : selectedAssociate?.creditAmortization?.[0]?.quotaAmount;
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
            Busque y seleccione el asociado para el pago del crédito
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
                  {selectedAssociate.creditModality && (
                    <div className="mt-2 text-sm">
                      Modalidad Préstamo: {selectedAssociate.creditModality}
                    </div>
                  )}
                  {selectedAssociate.creditType && (
                    <div className="mt-2 text-sm">
                      Tipo Préstamo: {selectedAssociate.creditType}
                    </div>
                  )}
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
              {selectedAssociate.creditAmortization &&
              selectedAssociate.creditAmortization.length > 0 ? (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Saldo Pendiente:</span>
                    <span className="font-semibold text-green-600">
                      {selectedAssociate?.creditTotalAmount ?? 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="font-medium">Cuota Actual:</span>
                    <span className="font-semibold text-green-600">
                      {selectedAssociate.creditAmortization[0]?.quotaNumber ??
                        'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="font-medium">Valor de Cuota:</span>
                    <span className="font-semibold text-green-600">
                      {Number(couta).toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay información de amortización disponible.
                </p>
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
