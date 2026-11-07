'use client';

import { useState, useCallback, useEffect } from 'react';
import { Search, User, X, Wallet, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Input } from '@repo/shadcn/input';
import { useToastSystem } from '@/hooks/use-toast-system';
import { useSearchAssociate } from '../hooks/use-credits-management-query';
import { type SearchAssociateResult } from '../schemas/credits-management-api-response';

interface CreditSearchProps {
  onSelectAssociate: (associate: SearchAssociateResult | null) => void;
  selectedAssociate: SearchAssociateResult | null;
}

function formatCurrency(n: number) {
  return n?.toLocaleString('es', { minimumFractionDigits: 2 }) ?? '0,00';
}

export function CreditSearch({
  onSelectAssociate,
  selectedAssociate,
}: CreditSearchProps) {
  const toast = useToastSystem();
  const [cedula, setCedula] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { data, error, isLoading, isError } = useSearchAssociate(
    shouldFetch ? cedula : '',
    { enabled: shouldFetch && cedula.length >= 7 },
  );

  useEffect(() => {
    if (data) {
      onSelectAssociate(data);
    }
  }, [data, onSelectAssociate]);

  useEffect(() => {
    if (!isError || !shouldFetch) return;

    setShouldFetch(false);
    onSelectAssociate(null);

    const err = error as {
      message?: string;
      response?: {
        status?: number;
        data?: { message?: string | string[] };
      };
    };
    const backendMessage = Array.isArray(err?.response?.data?.message)
      ? err.response?.data?.message.join(' ')
      : err?.response?.data?.message;
    const message = backendMessage || err?.message || '';
    const normalized = message.toLowerCase();
    const status = err?.response?.status;

    if (normalized.includes('liquidado') || normalized.includes('retired')) {
      const detail =
        'El asociado está liquidado y no puede crear créditos.';
      setSearchError(detail);
      toast.info({ title: 'Asociado liquidado', description: detail });
    } else if (
      normalized.includes('inactivo') ||
      normalized.includes('inactive')
    ) {
      const detail = 'El asociado está inactivo y no puede crear créditos.';
      setSearchError(detail);
      toast.warning({ title: 'Asociado inactivo', description: detail });
    } else if (
      status === 404 ||
      normalized.includes('not found') ||
      normalized.includes('no encontrado')
    ) {
      const detail = `No se encontró un asociado con la cédula ${cedula}.`;
      setSearchError('Asociado no encontrado.');
      toast.info({ title: 'Asociado no encontrado', description: detail });
    } else {
      setSearchError('Error realizando la búsqueda.');
      toast.error({
        title: 'Error realizando la búsqueda',
        description: 'Contacte con el administrador del sistema.',
      });
    }
  }, [isError, error, cedula, onSelectAssociate, shouldFetch, toast]);

  const handleSearch = () => {
    if (cedula.length >= 7) {
      setSearchError(null);
      setShouldFetch(true);
    }
  };

  const handleClear = () => {
    setCedula('');
    setShouldFetch(false);
    setSearchError(null);
    onSelectAssociate(null);
  };

  const hasBlocks =
    selectedAssociate?.hasActiveLoan ||
    selectedAssociate?.hasActiveCredit ||
    selectedAssociate?.hasPayrollCredit;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5" />
          Buscar Asociado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Cédula del asociado"
              value={cedula}
              onChange={(e) => {
                setCedula(e.target.value.replace(/\D/g, '').slice(0, 8));
                setShouldFetch(false);
              }}
              maxLength={8}
              className="pr-8"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            {cedula && (
              <button
                onClick={handleClear}
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            onClick={handleSearch}
            disabled={cedula.length < 7 || isLoading}
            size="sm"
          >
            <Search className="h-4 w-4 mr-1" />
            Buscar
          </Button>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Buscando asociado...</p>
        )}

        {searchError && !selectedAssociate && (
          <p className="text-sm text-destructive">{searchError}</p>
        )}

        {selectedAssociate && (
          <div
            className={`rounded-lg border p-4 space-y-3 ${hasBlocks ? 'border-destructive/30 bg-destructive/5' : 'border-emerald-500/30 bg-emerald-50'}`}
          >
            <div className="flex items-center gap-2">
              <User
                className={`h-5 w-5 ${hasBlocks ? 'text-destructive' : 'text-emerald-600'}`}
              />
              <span className="font-semibold">DATOS DEL ASOCIADO</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Nombre:</span>{' '}
                <span className="font-medium">
                  {selectedAssociate.associate.fullname}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Cédula:</span>{' '}
                <span className="font-mono">
                  {selectedAssociate.associate.cedula}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Nro. Cuenta:</span>{' '}
                <span className="font-mono">
                  {selectedAssociate.account?.accountNumber || '—'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Saldo Total:</span>{' '}
                <span className="font-mono font-semibold text-blue-600">
                  {formatCurrency(selectedAssociate.balance)} Bs
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Salario Base:</span>{' '}
                <span className="font-mono">
                  {formatCurrency(selectedAssociate.baseSalary)} Bs
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Capac. Pago (30%):</span>{' '}
                <span className="font-mono font-semibold text-emerald-600">
                  {formatCurrency(selectedAssociate.paymentCapacity)} Bs/mes
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">80% Disponible:</span>
              </div>
              <span className="text-lg font-bold text-blue-600 font-mono">
                {formatCurrency(selectedAssociate.available80)} Bs
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedAssociate.hasActiveLoan && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> Préstamo Activo
                </Badge>
              )}
              {selectedAssociate.hasActiveCredit && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> Crédito Activo
                </Badge>
              )}
              {selectedAssociate.hasPayrollCredit && (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> Credinomina Activo
                </Badge>
              )}
              {!hasBlocks && (
                <Badge variant="default" className="bg-emerald-600 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Sin bloqueos
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
