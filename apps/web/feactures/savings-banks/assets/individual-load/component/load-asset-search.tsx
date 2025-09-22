'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import { toast } from '@/components/use-toast';
import { formatCurrency } from '@/lib/formatCurrent';
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
import { useAssociatesByCedula } from '../hooks/use-query-individual-load';
import { Associates } from '../schemas/individual-load-api-schema';

interface LoadAssetsSearchProps {
  onSelectAssociate: (associate: Associates | null) => void;
  selectedAssociate: any | null;
  shouldClearSearch: boolean;
  onClearSearch: () => void;
}

export function LoadAssetsSearch({
  onSelectAssociate,
  selectedAssociate,
  shouldClearSearch,
  onClearSearch,
}: LoadAssetsSearchProps) {
  const [searchTerm, setSearchTerm] = useState(''); // Controla el valor del input
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState(''); // Término enviado para la búsqueda
  const [shouldFetch, setShouldFetch] = useState(false); // Flag para iniciar la búsqueda

  const [searchResults, setSearchResults] = useState<Associates | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const queryClient = useQueryClient();
  // Usar el hook con la opción `enabled` para controlar su ejecución
  const { data, error, isLoading, isError } = useAssociatesByCedula(
    submittedSearchTerm,
    {
      enabled: shouldFetch && !!submittedSearchTerm.trim(), // Activar solo si shouldFetch es true y hay un término
    },
  );

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

    if (shouldFetch) {
      // Solo si *nosotros* activamos la búsqueda
      setShouldFetch(false); // Reseteamos nuestro flag, la query ya se ejecutó o falló.

      if (isError) {
        // Manejo del error
        const errorMessage = error.message || 'Error desconocido';
        if (errorMessage.includes('not found')) {
          toast({
            title: 'Asociado no encontrado',
            description: `No se encontró un asociado con la cédula ${searchTerm}.`,
          });
        } else if (errorMessage.includes('retired')) {
          toast({
            title: 'Asociado retirado',
            description:
              'el asociado está liquidado de la caja de ahorro y no puede ser seleccionado.',
          });
        } else {
          toast({
            title: 'Error realizando la búsqueda',
            description: 'Conctate con el administrador del sistema.',
          });
        }
      } else if (data) {
        setSearchResults(data.data); // Actualiza los resultados con los datos del servidor
        onSelectAssociate(data.data);
      } else {
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
    isError,
    error,
    isLoading,
    setSearchResults,
    submittedSearchTerm,
    shouldFetch,
  ]);

  // Efecto para limpiar el input cuando shouldClearSearch sea true
  useEffect(() => {
    if (shouldClearSearch) {
      setSearchTerm(''); // Limpiar el input
      setSubmittedSearchTerm('');
      setSearchResults(null); // Limpiar los resultados de búsqueda
      onClearSearch(); // Notificar al componente padre que se limpió el input
    }
  }, [shouldClearSearch, queryClient, setSearchResults, onClearSearch]);

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

    // Limpiar caché y estado antes de nueva búsqueda
    queryClient.removeQueries({
      queryKey: ['assets-individual-load-associates-by-cedula'],
      exact: false,
    });
    
    // Limpiar estado previo
    setSearchResults(null);
    onSelectAssociate(null);

    setSubmittedSearchTerm(trimmedSearchTerm);
    setShouldFetch(true); // Activa la ejecución del hook
  }, [searchTerm, queryClient, onSelectAssociate]);

  // Función para limpiar la selección de asociado
  const clearAssociate = useCallback(() => {
    queryClient.removeQueries({
      queryKey: ['assets-individual-load-associates-by-cedula'],
      exact: false,
    });
    onSelectAssociate(null);
    setSearchTerm('');
    setSearchResults(null);
    setSubmittedSearchTerm('');
    setShouldFetch(false);
  }, [onSelectAssociate, queryClient]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWrapper className="w-8 h-8">
            <User />
          </IconWrapper>
          Selección de Asociado
        </CardTitle>
        <CardDescription>
          Busque y seleccione el asociado al que desea cargar haberes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="associate-search"
                placeholder="Buscar por nombre o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} // Solo actualiza el estado, no ejecuta la búsqueda
                disabled={isLoading} // Deshabilitar mientras carga
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchTerm.trim() || isSearching}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Buscar</span>
            </Button>
          </div>

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
                <div>
                  <h3 className="font-medium text-lg">
                    {selectedAssociate.fullname}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedAssociate.cedula}
                  </p>
                  <div className="mt-2">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100">
                      Cuenta: {selectedAssociate.accountNumber}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearAssociate}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Saldo Actual:</span>
                <span className="font-bold text-lg">
                  {formatCurrency(Number(selectedAssociate.balance), 'VES')}
                </span>
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
