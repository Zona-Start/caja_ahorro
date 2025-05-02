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
import { Loader2, Search, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Associates | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);

  // Usar el hook con la opción `enabled` para controlar su ejecución
  const { data, error, status, isError, isLoading } = useAssociatesByCedula(
    searchTerm,
    {
      enabled: shouldFetch, // Solo se ejecuta si `searchTerm` no está vacío
    },
  );

  // Efecto para manejar los resultados de la búsqueda cuando el hook devuelve datos
  useEffect(() => {
    if (data) {
      setSearchResults(data.data); // Actualiza los resultados con los datos del servidor
      onSelectAssociate(data.data);
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
    setTimeout(() => setShouldFetch(true), 0); // Reinicia el estado para permitir nuevas búsquedas
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWrapper color="indigo" className="w-8 h-8">
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

          {selectedAssociate ? (
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
                <Button variant="ghost" size="icon" onClick={clearAssociate}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Saldo Actual:</span>
                <span className="font-bold text-lg">
                  {selectedAssociate.balance} VES
                </span>
              </div>
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
