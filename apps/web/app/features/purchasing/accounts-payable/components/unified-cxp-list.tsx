import { useState, useMemo } from 'react';
import { Button } from '@repo/shadcn/button';
import { Checkbox } from '@repo/shadcn/checkbox';
import { Badge } from '@repo/shadcn/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/shadcn/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { formatCurrency } from '@/lib/format-utils';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Banknote, CheckCircle, Eye, MoreHorizontal, Loader2 } from 'lucide-react';
import { useAuthorizeAccountsPayableMutation } from '../hooks/use-accounts-payable-mutations';
import { accountsPayableService } from '../services/accounts-payable-service';
import type { AccountsPayableApi } from '../schemas/accounts-payable-api.schema';
import { STATUS_OPTIONS } from '../schemas/accounts-payable-options';
import { AccountsPayableViewModal } from '@/features/purchasing/accounts-payable/components/accounts-payable-tables/accounts-payable-view-modal';
import { BulkPaymentModal } from '@/features/purchasing/supplier-payments/components/bulk-payment-modal';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'secondary',
  APPROVED: 'default',
  PARTIALLY_PAID: 'outline',
  PAID: 'outline',
  CANCELLED: 'destructive',
};

export function UnifiedCxpList() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['accounts-payable', 'unified', page],
    queryFn: () => accountsPayableService.getAll({ page, limit, search: '', status: '' }),
  });

  const { mutateAsync: authorizeCxp } = useAuthorizeAccountsPayableMutation();

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [viewAccountId, setViewAccountId] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [payingItems, setPayingItems] = useState<{ id: string; supplierId: string; supplierName: string; amount: number; reference: string }[]>([]);

  const allItems = (data?.data || []) as AccountsPayableApi[];

  const isPayable = (item: AccountsPayableApi) =>
    item.status === 'APPROVED' || item.status === 'PARTIALLY_PAID';

  const toggleSelect = (id: string, item: AccountsPayableApi) => {
    if (!isPayable(item)) return;
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    const payable = allItems.filter(isPayable);
    if (payable.every((i) => selected[i.id])) {
      setSelected({});
    } else {
      setSelected(Object.fromEntries(payable.map((i) => [i.id, true])));
    }
  };

  const selectedItems = useMemo(
    () => allItems.filter((i) => selected[i.id]),
    [allItems, selected],
  );

  const allSameSupplier = selectedItems.every((i) => i.supplierId === selectedItems[0]?.supplierId);
  const totalSelected = selectedItems.reduce((s, i) => s + i.remainingAmount, 0);

  const handlePaySelection = () => {
    setPayingItems(selectedItems.map((i) => ({
      id: i.id,
      supplierId: i.supplierId || '',
      supplierName: i.supplierName,
      amount: i.remainingAmount,
      reference: i.accountsPayableNumber || i.invoiceNumber,
    })));
    setShowPaymentModal(true);
  };

  const handlePaySingle = (item: AccountsPayableApi) => {
    setPayingItems([{
      id: item.id,
      supplierId: item.supplierId || '',
      supplierName: item.supplierName,
      amount: item.remainingAmount,
      reference: item.accountsPayableNumber || item.invoiceNumber,
    }]);
    setShowPaymentModal(true);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const meta = data?.meta;
  const numPayable = allItems.filter(isPayable).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {selectedItems.length > 0 && allSameSupplier && (
          <Button variant="default" size="lg" onClick={handlePaySelection}>
            <Banknote className="mr-2 h-4 w-4" />
            Pagar Seleccionadas ({selectedItems.length})
          </Button>
        )}
        {selectedItems.length > 0 && !allSameSupplier && (
          <span className="text-sm text-destructive">Selecciona solo CxP del mismo proveedor</span>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={numPayable > 0 && allItems.filter(isPayable).every((i) => selected[i.id])}
                  disabled={numPayable === 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>N° CXP</TableHead>
              <TableHead>Factura</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">Pendiente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead className="w-20">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No hay cuentas por pagar registradas
                </TableCell>
              </TableRow>
            ) : (
              allItems.map((item: AccountsPayableApi) => (
                <TableRow key={item.id} className={selected[item.id] ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={!!selected[item.id]}
                      disabled={!isPayable(item)}
                      onCheckedChange={() => toggleSelect(item.id, item)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-xs">{item.accountsPayableNumber || '—'}</TableCell>
                  <TableCell className="text-xs">{item.invoiceNumber || item.supplierInvoiceNumber || '—'}</TableCell>
                  <TableCell className="text-xs">{item.supplierName}</TableCell>
                  <TableCell className="text-right text-xs">{formatCurrency(item.originalAmount, 'VES')}</TableCell>
                  <TableCell className="text-right text-xs font-medium">{formatCurrency(item.remainingAmount, 'VES')}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[item.status] || 'secondary'} className="text-xs">
                      {STATUS_OPTIONS[item.status as keyof typeof STATUS_OPTIONS] || item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {item.dueDate ? format(new Date(item.dueDate), 'dd/MM/yyyy') : '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setViewAccountId(item.id);
                            setViewOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </DropdownMenuItem>
                        {item.status === 'PENDING' && (
                          <DropdownMenuItem
                            className="text-green-600"
                            onClick={() => authorizeCxp(item.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Autorizar Pago
                          </DropdownMenuItem>
                        )}
                        {isPayable(item) && (
                          <DropdownMenuItem onClick={() => handlePaySingle(item)}>
                            <Banknote className="mr-2 h-4 w-4" />
                            Pagar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Mostrando {allItems.length} de {meta.totalCount} registros</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Anterior
            </Button>
            <span>Pág {page} de {meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <BulkPaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        selectedItems={payingItems as any}
        totalAmount={totalSelected}
        supplierId={selectedItems[0]?.supplierId || ''}
      />

      <AccountsPayableViewModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        accountId={viewOpen ? viewAccountId! : undefined}
      />
    </div>
  );
}
