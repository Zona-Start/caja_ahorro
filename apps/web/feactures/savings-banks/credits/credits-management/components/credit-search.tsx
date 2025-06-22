'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import { toast } from '@/components/use-toast';
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
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient
import { Loader2, Search, User, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAssociatesByCedula } from '../hooks/use-query-individual-credit';
import { AssociatesLoan } from '../schemas/individual-credit-api-schema';

interface CreditSearchProps {
  onSelectAssociate: (associate: AssociatesLoan | null) => void;
  selectedAssociate: AssociatesLoan | null;
  shouldClearSearch: boolean;
  onClearSearch: () => void;
  currentCurrencyCode: string | undefined;
  currentExchangeRate: number | undefined;
  isEdit?: boolean;
}

export function CreditSearch({
  onSelectAssociate,
  selectedAssociate,
  shouldClearSearch,
  onClearSearch,
  currentCurrencyCode,
  currentExchangeRate,
  isEdit = false,
}: CreditSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState(''); // Término enviado para la búsqueda
  const [shouldFetch, setShouldFetch] = useState(false);
  const [searchResults, setSearchResults] = useState<AssociatesLoan | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);
  const queryClient = useQueryClient(); // Get query client instance

  // Usar el hook con la opción `enabled` para controlar su ejecución
  const { data, error, isError, isLoading } = useAssociatesByCedula(submittedSearchTerm, {
    enabled: shouldFetch && !!submittedSearchTerm.trim(), // Solo se ejecuta si `searchTerm` no está vacío
  });

  // Efecto para manejar los resultados de la búsqueda cuando el hook devuelve datos
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
        setSearchResults(null); // Actualiza los resultados con los datos del servidor
        onSelectAssociate(null);
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
      } else if (data) {
        setSearchResults(data); // Actualiza los resultados con los datos del servidor
        onSelectAssociate(data);
      } else if (submittedSearchTerm && !data) {
         setSearchResults(null); // Actualiza los resultados con los datos del servidor
         onSelectAssociate(null);
          toast({
          title: 'Información no disponible',
          description: `No se encontró información para la cédula ${submittedSearchTerm}.`,
        });
      }
    }
  }, [
    data,
    error,
    isError,
    isLoading,
    onSelectAssociate,
    submittedSearchTerm,
    shouldFetch,
  ]);

  // Efecto para limpiar el input cuando shouldClearSearch sea true
  useEffect(() => {
    if (shouldClearSearch) {
      setSearchTerm(''); // Limpiar el input
      setSearchResults(null); // Limpiar los resultados de búsqueda
      onClearSearch(); // Notificar al componente padre que se limpió el input
      // No es necesario limpiar la caché aquí, ya que clearAssociate lo hará
    }
  }, [shouldClearSearch, onClearSearch, queryClient]);

   // Función para buscar asociados
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
      onSelectAssociate,
    ]);
  // Función para limpiar la selección de asociado
  const clearAssociate = useCallback(() => {
    onSelectAssociate(null);
    setSearchTerm('');
    setSubmittedSearchTerm('');
    setSearchResults(null);
    setShouldFetch(false);
    // Remove the generic query key as well, just in case
    queryClient.removeQueries({
      queryKey: ['credit-associates-individual-by-cedula'],
    });
    // No need for setTimeout to re-enable fetch immediately
  }, [
    queryClient,
    onSelectAssociate,
  ]);


  // Efecto para manejar la tecla Enter en la búsqueda
  useEffect(() => {
    const handleKeyPress = (e: any) => {
      if (
        e.key === 'Enter' &&
        document.activeElement === document.getElementById('associate-search')
      ) {
        handleSearch();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [searchTerm]);

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
    selectedAssociate?.associate?.isPayrollCredit === true;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWrapper color="blue" className="w-8 h-8">
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
                  onChange={(e) => setSearchTerm(e.target.value)} // Solo actualiza el estado, no ejecuta la búsqueda
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

          {!isLoading && selectedAssociate &&  (
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
                  <Button variant="ghost" size="icon" onClick={clearAssociate}   disabled={isLoading}>
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
                    {selectedAssociate?.associate?.isPayrollCredit &&
                    selectedAssociate?.totalCredits !== 0
                      ? 'posee un credinomina activo y un crédito sin cancelar'
                      : selectedAssociate?.associate?.isPayrollCredit
                        ? 'posee un credinomina activo'
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
