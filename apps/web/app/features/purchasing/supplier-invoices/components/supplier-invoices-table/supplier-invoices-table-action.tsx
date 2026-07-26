import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SupplierInvoicesFilters } from '../../hooks/use-supplier-invoices-filters';
import { INVOICE_STATUS_LABELS } from '../../schemas/supplier-invoice-options';

interface SupplierInvoicesTableActionProps {
  filters: SupplierInvoicesFilters;
  setFilters: (newFilters: Partial<SupplierInvoicesFilters>) => void;
  clearFilters: () => void;
}

export function SupplierInvoicesTableAction({
  filters,
  setFilters,
  clearFilters,
}: SupplierInvoicesTableActionProps) {
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
    <div className="flex items-center gap-2 flex-wrap">
      <Input
        placeholder="Buscar facturas..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="w-[250px]"
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
          {Object.entries(INVOICE_STATUS_LABELS).map(([key, label]) => (
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
  );
}
