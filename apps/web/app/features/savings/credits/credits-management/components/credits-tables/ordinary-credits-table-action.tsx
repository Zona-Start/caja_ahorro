'use client';

import { Button } from '@repo/shadcn/button';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Plus } from 'lucide-react';
import { useCreditsFilters } from '../../hooks/use-credits-filters';
import { ESTATUS_TYPES } from '../../schemas/credits-management-options';
import { useAuthStore } from '@/stores/auth.store';

interface OrdinaryCreditsTableActionProps {
  onNewCredit: () => void;
}

export function OrdinaryCreditsTableAction({
  onNewCredit,
}: OrdinaryCreditsTableActionProps) {
  const { filters, setFilters } = useCreditsFilters();

  const STATUS_OPTIONS = Object.entries(ESTATUS_TYPES).map(
    ([value, label]) => ({
      value,
      label,
    }),
  );
  const hasPermission = useAuthStore((state) => state.hasPermission);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
        <DataTableSearch
          title="Buscar por cédula o nombre"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v: string) => setFilters({ search: v || '', page: 1 })}
          setPage={(p: number) => setFilters({ page: p })}
        />

        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            setFilters({ status: value === 'all' ? '' : value })
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hasPermission("portfolio:credits", "create") && (
        <Button size="sm" onClick={onNewCredit}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Crédito
        </Button>
      )}
    </div>
  );
}
