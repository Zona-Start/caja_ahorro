'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@repo/shadcn/command';
import { Input } from '@repo/shadcn/input';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/shadcn/popover';
import { Separator } from '@repo/shadcn/separator';
import { Loader2, Search, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';

// Datos de ejemplo para asociados
const mockAssociates = [
  {
    id: '1',
    name: 'Juan Pérez',
    document: 'V-12345678',
    savings: 5000,
    assets: 12000,
    availability: 9600,
    blocks: [],
  },
  {
    id: '2',
    name: 'María González',
    document: 'V-23456789',
    savings: 8500,
    assets: 15000,
    availability: 12000,
    blocks: [{ reason: 'Préstamo en curso', amount: 3000 }],
  },
  {
    id: '3',
    name: 'Carlos Rodríguez',
    document: 'V-34567890',
    savings: 3200,
    assets: 8000,
    availability: 6400,
    blocks: [],
  },
  {
    id: '4',
    name: 'Ana Martínez',
    document: 'V-45678901',
    savings: 7500,
    assets: 18000,
    availability: 14400,
    blocks: [{ reason: 'Garantía', amount: 2000 }],
  },
];

interface LoanSearchProps {
  onSelectAssociate: (associate: any) => void;
  selectedAssociate: any | null;
}

export function LoanSearch({
  onSelectAssociate,
  selectedAssociate,
}: LoanSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<typeof mockAssociates>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [openAssociateSearch, setOpenAssociateSearch] = useState(false);

  // Función para buscar asociados
  const handleSearch = () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);

    // Simulamos una búsqueda con un pequeño delay
    setTimeout(() => {
      const results = mockAssociates.filter(
        (associate) =>
          associate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          associate.document.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setSearchResults(results);
      setIsSearching(false);
      setOpenAssociateSearch(true);
    }, 500);
  };

  // Función para seleccionar un asociado
  const selectAssociate = (associate: any) => {
    onSelectAssociate(associate);
    setOpenAssociateSearch(false);
  };

  // Función para limpiar la selección de asociado
  const clearAssociate = () => {
    onSelectAssociate(null);
    setSearchTerm('');
    setSearchResults([]);
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
          <IconWrapper color="blue" className="w-8 h-8">
            <User />
          </IconWrapper>
          Selección de Asociado
        </CardTitle>
        <CardDescription>
          Busque y seleccione el asociado para el préstamo
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
                onChange={(e) => setSearchTerm(e.target.value)}
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

          <Popover
            open={openAssociateSearch}
            onOpenChange={setOpenAssociateSearch}
          >
            <PopoverTrigger asChild>
              <span className="hidden">Resultados</span>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandList>
                  <CommandEmpty>No se encontraron resultados</CommandEmpty>
                  <CommandGroup heading="Resultados de búsqueda">
                    {searchResults.map((associate) => (
                      <CommandItem
                        key={associate.id}
                        onSelect={() => selectAssociate(associate)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <p className="font-medium">{associate.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {associate.document}
                            </p>
                          </div>
                          <Badge variant="outline">
                            Disponible: ${associate.availability.toFixed(2)}
                          </Badge>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedAssociate ? (
            <div className="rounded-lg border p-4 mt-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">
                    {selectedAssociate.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedAssociate.document}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={clearAssociate}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Separator className="my-3" />
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Ahorros:</span>
                  <span className="font-medium">
                    ${selectedAssociate.savings.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Haberes:</span>
                  <span className="font-medium">
                    ${selectedAssociate.assets.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">80% de Haberes:</span>
                  <span className="font-medium">
                    ${(selectedAssociate.assets * 0.8).toFixed(2)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Disponibilidad:</span>
                  <span className="font-bold text-green-600">
                    ${selectedAssociate.availability.toFixed(2)}
                  </span>
                </div>

                {selectedAssociate.blocks.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-sm font-medium text-red-500">
                      Bloqueos:
                    </p>
                    {selectedAssociate.blocks.map((block: any, index: any) => (
                      <div key={index} className="text-sm mt-1">
                        <span className="text-red-500">
                          {block.reason}: ${block.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
