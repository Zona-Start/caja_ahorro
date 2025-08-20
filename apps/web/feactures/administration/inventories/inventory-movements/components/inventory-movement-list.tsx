'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useInventoryMovements } from '../hooks/use-query-inventory-movement';
import { columns } from './inventory-movement-tables/columns';

interface InventoryMovementListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialItemId?: number | null; // Changed from initialProductId
  initialItemType?: string | null; // Changed from initialProductId
  initialMovementType?: string | null;
  initialDocumentType?: string | null;
  initialDocumentNumber?: string | null;
}

export default function InventoryMovementList({
  initialPage,
  initialSearch,
  initialLimit,
  initialItemId, // Changed from initialProductId
  initialItemType, // Changed from initialProductId
  initialMovementType,
  initialDocumentType,
  initialDocumentNumber,
}: InventoryMovementListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialItemId && { itemId: initialItemId }), // Changed from productId
    ...(initialItemType && { itemType: initialItemType }), // Changed from productId
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
