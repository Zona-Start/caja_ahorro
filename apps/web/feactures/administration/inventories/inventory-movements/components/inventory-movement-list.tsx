'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useInventoryMovements } from '../hooks/use-query-inventory-movement';
import { columns } from './inventory-movement-tables/columns';

interface InventoryMovementListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialProductId?: number | null;
  initialMovementType?: string | null;
  initialDocumentType?: string | null;
  initialDocumentNumber?: string | null;
}

export default function InventoryMovementList({
  initialPage,
  initialSearch,
  initialLimit,
  initialProductId,
  initialMovementType,
  initialDocumentType,
  initialDocumentNumber,
}: InventoryMovementListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialProductId && { productId: initialProductId }),
    ...(initialMovementType && { movementType: initialMovementType }),
    ...(initialDocumentType && { documentType: initialDocumentType }),
    ...(initialDocumentNumber && { documentNumber: initialDocumentNumber }),
  };

  const { data, isLoading } = useInventoryMovements(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={initialLimit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      totalItems={data?.meta?.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
