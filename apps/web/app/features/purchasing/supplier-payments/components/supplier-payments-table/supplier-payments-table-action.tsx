import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SupplierPaymentsFilters } from '../../hooks/use-supplier-payments-filters';
import { PAYMENT_STATUS_LABELS } from '../../schemas/supplier-payment-options';

interface SupplierPaymentsTableActionProps {
  filters: SupplierPaymentsFilters;
  setFilters: (newFilters: Partial<SupplierPaymentsFilters>) => void;
  clearFilters: () => void;
  onPayClick: () => void;
  onAdvanceClick: () => void;
}

export function SupplierPaymentsTableAction({
  filters,
  setFilters,
  clearFilters,
  onPayClick,
  onAdvanceClick,
}: SupplierPaymentsTableActionProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchValue !== (filters.search || '')) {
        setFilters({ search: searchValue, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchValue]);

  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  const hasActiveFilters = !!filters.search || !!filters.status;

  const handleClear = () => {
    setSearchValue('');
    clearFilters();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Input
          placeholder="Buscar pagos..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full sm:w-[250px]"
        />
        <Select
          value={filters.status}
          onValueChange={(value) =>
            setFilters({ status: value === 'ALL' ? '' : value, page: 1 })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleClear} className="h-9 px-2">
            <X className="mr-1 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <Button onClick={onAdvanceClick} variant="outline" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Anticipo
        </Button>
        <Button onClick={onPayClick} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Registrar Pago
        </Button>
      </div>
    </div>
  );
}
