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
import { Input } from '@repo/shadcn/input';
import { DataTable } from '@repo/shadcn/table/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Search } from 'lucide-react';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';
import {
  useDeliveryNoteDetail,
  useDeliveryNotes,
} from '../../hooks/use-sales-queries';
import type { DeliveryNote } from '../../schemas/sales.schema';

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('es-VE') : '—';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  DISPATCHED: 'Despachada',
  INVOICED: 'Facturada',
  CANCELLED: 'Anulada',
};

export default function DeliveryNotesPage() {
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [limit] = useQueryState('limit', parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault(''),
  );
  const [searchInput, setSearchInput] = useState(search);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) setSearch(searchInput || null);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search, setSearch]);

  const { data } = useDeliveryNotes({
    page,
    limit,
    search: search || undefined,
  });

  const columns: ColumnDef<DeliveryNote>[] = [
    { accessorKey: 'deliveryNumber', header: 'Nota' },
    {
      accessorKey: 'customerName',
      header: 'Cliente',
      cell: ({ row }) => row.original.customerName || '—',
    },
    {
      accessorKey: 'issueDate',
      header: 'Fecha',
      cell: ({ row }) => formatDate(row.original.issueDate),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDetailId(row.original.id)}
        >
          <Eye className="mr-1 h-4 w-4" /> Ver
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <Heading
        title="Notas de Entrega"
        description="Consulta las notas de entrega generadas desde las ventas."
      />

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
        <Input
          className="pl-8"
          placeholder="Buscar por nota o cliente"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        totalItems={data?.meta.totalCount ?? 0}
        pageSizeOptions={[10, 20, 30, 50]}
      />

      <DeliveryNoteDetailModal
        noteId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}

function DeliveryNoteDetailModal({
  noteId,
  onClose,
}: {
  noteId: string | null;
  onClose: () => void;
}) {
  const { data: note, isLoading } = useDeliveryNoteDetail(noteId ?? '');

  return (
    <Dialog open={!!noteId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Nota {note?.deliveryNumber ?? ''}</DialogTitle>
          <DialogDescription>
            {note?.customerName} · {formatDate(note?.issueDate)}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        )}

        {note && (
          <div className="space-y-3 text-sm">
            {(note.items ?? []).map((item, index) => (
              <div
                key={item.id ?? index}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <span>{item.productName || 'Producto'}</span>
                <span className="font-mono">× {item.quantity}</span>
              </div>
            ))}
            {note.notes && (
              <p className="text-muted-foreground text-xs">{note.notes}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
