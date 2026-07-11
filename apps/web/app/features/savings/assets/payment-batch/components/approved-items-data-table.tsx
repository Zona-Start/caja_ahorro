import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { Button } from '@repo/shadcn/button';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { type PaymentBatchApprovedItem } from './payment-batch-columns';

interface ApprovedItemsDataTableProps {
  columns: ColumnDef<PaymentBatchApprovedItem>[];
  data: PaymentBatchApprovedItem[];
  rowSelection: Record<string, boolean>;
  onRowSelectionChange: (rowSelection: Record<string, boolean>) => void;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  totalCount?: number;
}

export function ApprovedItemsDataTable({
  columns,
  data,
  rowSelection,
  onRowSelectionChange,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  totalCount,
}: ApprovedItemsDataTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: (updaterOrValue) => {
      const newSelection =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(rowSelection)
          : updaterOrValue;
      onRowSelectionChange(newSelection);
    },
    state: {
      rowSelection,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">No hay registros pendientes</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Sin resultados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {hasNextPage && (
        <div className="flex items-center justify-center py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNextPage}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Cargando...
              </>
            ) : (
              `Cargar más (${data.length} de ${totalCount || '...'})`
            )}
          </Button>
        </div>
      )}
    </>
  );
}
