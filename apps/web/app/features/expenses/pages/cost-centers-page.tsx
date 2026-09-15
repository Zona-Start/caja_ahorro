import { formatCurrency } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Heading } from '@repo/shadcn/heading';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { CostCenterForm } from '../components/cost-center-form';
import { useCostCentersQuery } from '../hooks/use-cost-center-queries';
import type { CostCenter } from '../schemas/cost-centers.schema';

export default function CostCentersPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const { data, isLoading } = useCostCentersQuery(filters);
  const [openCreate, setOpenCreate] = useState(false);

  const columns: ColumnDef<CostCenter>[] = [
    { accessorKey: 'code', header: 'Código' },
    { accessorKey: 'name', header: 'Nombre' },
    {
      accessorKey: 'monthlyBudget',
      header: 'Presupuesto Mensual',
      cell: ({ getValue }) => {
        const value = getValue<string | null>();
        return value ? formatCurrency(Number(value), 'VES') : '-';
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ getValue }) => (
        <Badge variant={getValue<boolean>() ? 'success' : 'destructive'}>
          {getValue<boolean>() ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading
          title="Centros de Costo"
          description="Define centros de costo y sus presupuestos mensuales"
        />
        <Button onClick={() => setOpenCreate(true)}>
          Nuevo Centro de Costo
        </Button>
      </div>

      {isLoading ? (
        <DataTableSkeleton columnCount={4} rowCount={filters.limit} />
      ) : (
        <DataTable
          columns={columns}
          data={(data?.data || []) as unknown as CostCenter[]}
          totalItems={data?.meta?.totalCount || 0}
          pageSizeOptions={[10, 20, 30, 50]}
        />
      )}

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Nuevo Centro de Costo</DialogTitle>
            <DialogDescription>
              Configura un centro de costo para el control presupuestario.
            </DialogDescription>
          </DialogHeader>
          <CostCenterForm
            onSuccess={() => setOpenCreate(false)}
            onCancel={() => setOpenCreate(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
