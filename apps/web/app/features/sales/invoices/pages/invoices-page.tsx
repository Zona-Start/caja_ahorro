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
import { Separator } from '@repo/shadcn/separator';
import { DataTable } from '@repo/shadcn/table/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, FileText, Search, XCircle } from 'lucide-react';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';
import {
  useInvoice,
  useInvoicesPaginated,
} from '../../hooks/use-sales-queries';
import {
  useCancelInvoiceMutation,
  useGenerateDeliveryNoteMutation,
} from '../../hooks/use-sales-mutations';
import {
  SALE_STATUS_LABELS,
  type SaleInvoice,
} from '../../schemas/sales.schema';

const fmt = (value: unknown) =>
  (Number(value) || 0).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('es-VE') : '—';

const statusVariant = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'success' as const;
    case 'CANCELLED':
      return 'destructive' as const;
    case 'PARTIALLY_PAID':
      return 'warning' as const;
    default:
      return 'secondary' as const;
  }
};

export default function InvoicesPage() {
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [limit] = useQueryState('limit', parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault(''),
  );
  const [searchInput, setSearchInput] = useState(search);
  const [detailId, setDetailId] = useState<string | null>(null);

  const cancelMutation = useCancelInvoiceMutation();
  const deliveryMutation = useGenerateDeliveryNoteMutation();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) setSearch(searchInput || null);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search, setSearch]);

  const { data } = useInvoicesPaginated({
    page,
    limit,
    search: search || undefined,
  });

  const columns: ColumnDef<SaleInvoice>[] = [
    { accessorKey: 'invoiceNumber', header: 'Factura' },
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
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ row }) => `Bs. ${fmt(row.original.totalAmount)}`,
    },
    {
      accessorKey: 'balance',
      header: 'Saldo',
      cell: ({ row }) => `Bs. ${fmt(row.original.balance)}`,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)}>
          {SALE_STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDetailId(row.original.id)}
          >
            <Eye className="mr-1 h-4 w-4" /> Ver
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={
              deliveryMutation.isPending ||
              !!row.original.deliveryNoteId ||
              row.original.status === 'CANCELLED'
            }
            onClick={() => deliveryMutation.mutate(row.original.id)}
          >
            <FileText className="mr-1 h-4 w-4" /> Nota
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            disabled={
              cancelMutation.isPending || row.original.status === 'CANCELLED'
            }
            onClick={() => {
              if (confirm(`¿Anular la factura ${row.original.invoiceNumber}?`)) {
                cancelMutation.mutate(row.original.id);
              }
            }}
          >
            <XCircle className="mr-1 h-4 w-4" /> Anular
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <Heading
        title="Facturas de Venta"
        description="Consulta, imprime y anula las facturas emitidas."
      />

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
        <Input
          className="pl-8"
          placeholder="Buscar por factura o cliente"
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

      <InvoiceDetailModal
        invoiceId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
}

function InvoiceDetailModal({
  invoiceId,
  onClose,
}: {
  invoiceId: string | null;
  onClose: () => void;
}) {
  const { data: invoice, isLoading } = useInvoice(invoiceId ?? '');

  return (
    <Dialog open={!!invoiceId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>
            Factura {invoice?.invoiceNumber ?? ''}
          </DialogTitle>
          <DialogDescription>
            {invoice?.customerName} · {invoice?.customerTaxId}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        )}

        {invoice && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha</span>
              <span>{formatDate(invoice.issueDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vence</span>
              <span>{formatDate(invoice.dueDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado</span>
              <Badge variant={statusVariant(invoice.status)}>
                {SALE_STATUS_LABELS[invoice.status] ?? invoice.status}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-2">
              {(invoice.items ?? []).map((item, index) => (
                <div
                  key={item.id ?? index}
                  className="flex items-center justify-between"
                >
                  <span>
                    {item.productName || 'Producto'} × {item.quantity}
                  </span>
                  <span className="font-mono">Bs. {fmt(item.totalPrice)}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">Bs. {fmt(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA</span>
                <span className="font-mono">Bs. {fmt(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="font-mono">Bs. {fmt(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pagado</span>
                <span className="font-mono">Bs. {fmt(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo</span>
                <span className="font-mono">Bs. {fmt(invoice.balance)}</span>
              </div>
            </div>

            {invoice.notes && (
              <p className="text-muted-foreground border-t pt-2 text-xs">
                {invoice.notes}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
