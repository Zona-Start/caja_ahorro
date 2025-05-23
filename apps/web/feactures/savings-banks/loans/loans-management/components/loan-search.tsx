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
import { useEffect, useState } from 'react';
import { useAssociatesByCedula } from '../hooks/use-query-individual-load';
import { AssociatesLoan } from '../schemas/individual-load-api-schema';

interface LoanSearchProps {
  onSelectAssociate: (associate: AssociatesLoan | null) => void;
  selectedAssociate: AssociatesLoan | null;
  shouldClearSearch: boolean;
  onClearSearch: () => void;
  currentCurrencyCode: string | undefined;
  currentExchangeRate: number | undefined;
  isEdit?: boolean;
}

export function LoanSearch({
  onSelectAssociate,
  selectedAssociate,
  shouldClearSearch,
  onClearSearch,
  currentCurrencyCode,
  currentExchangeRate,
  isEdit = false,
}: LoanSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<AssociatesLoan | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);

  const queryClient = useQueryClient(); // Get query client instance

  // Usar el hook con la opción `enabled` para controlar su ejecución
  const { data, error, isError } = useAssociatesByCedula(searchTerm, {
    enabled: shouldFetch, // Solo se ejecuta si `searchTerm` no está vacío
  });

  // Efecto para manejar los resultados de la búsqueda cuando el hook devuelve datos
  useEffect(() => {
    if (data) {
      setSearchResults(data); // Actualiza los resultados con los datos del servidor
      onSelectAssociate(data);
    } else if (isError) {
      // Manejo del error
      const errorMessage = error.message || 'Error desconocido';
      if (errorMessage.includes('not found')) {
        toast({
          title: 'Asociado no encontrado',
          description: `No se encontró un asociado con la cédula ${searchTerm}.`,
        });
      } else {
        toast({
          title: 'Error realizando la búsqueda',
          description: errorMessage,
        });
      }
    }

    setIsSearching(false); // Finaliza el estado de búsqueda
    setShouldFetch(false); // Resetea el estado para evitar ejecuciones innecesarias
  }, [data, isError, error]);

  // Efecto para limpiar el input cuando shouldClearSearch sea true
  useEffect(() => {
    if (shouldClearSearch) {
      setSearchTerm(''); // Limpiar el input
      setSearchResults(null); // Limpiar los resultados de búsqueda
      onClearSearch(); // Notificar al componente padre que se limpió el input
      // No es necesario limpiar la caché aquí, ya que clearAssociate lo hará
    }
  }, [shouldClearSearch, onClearSearch]);

  // Función para buscar asociados
  const handleSearch = () => {
    if (!searchTerm.trim()) return; // No ejecutar si el término de búsqueda está vacío

    setIsSearching(true);
    setShouldFetch(true); // Activa la ejecución del hook
  };

  // Función para limpiar la selección de asociado
  const clearAssociate = () => {
    onSelectAssociate(null);
    setSearchTerm('');
    setSearchResults(null);
    setShouldFetch(false);
    // Remove the specific query from the cache when clearing
    queryClient.removeQueries({
      queryKey: ['associates-by-cedula', searchTerm],
    });
    // Remove the generic query key as well, just in case
    queryClient.removeQueries({ queryKey: ['associates-by-cedula'] });
    // No need for setTimeout to re-enable fetch immediately
  };

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
    selectedAssociate?.totalLoans !== 0 ||
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
          {!isEdit && 'Busque y seleccione el asociado para el préstamo'}
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
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={!searchTerm.trim() || isSearching}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Buscar</span>
              </Button>
            </div>
          )}

          {selectedAssociate ? (
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
                  <Button variant="ghost" size="icon" onClick={clearAssociate}>
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
                    selectedAssociate?.totalLoans !== 0
                      ? 'posee un credinomina activo y un préstamo sin cancelar'
                      : selectedAssociate?.associate?.isPayrollCredit
                        ? 'posee un credinomina activo'
                        : 'posee un préstamo sin cancelar'}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <div className="flex flex-col items-center justify-center text-muted-foreground">
                <User className="h-8 w-8 mb-2" />
                <p>Ningún asociado seleccionado</p>
                <p className="text-sm">
                  Busque y seleccione un asociado para continuar
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
