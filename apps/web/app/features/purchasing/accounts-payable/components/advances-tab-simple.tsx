import { useState } from 'react';
import { Button } from '@repo/shadcn/button';
import { Badge } from '@repo/shadcn/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/shadcn/table';
import { formatCurrency } from '@/lib/format-utils';
import { format } from 'date-fns';
import { Plus, Loader2 } from 'lucide-react';
import { useAllCreditsQuery } from '@/features/purchasing/supplier-payments/hooks/use-supplier-payments-queries';
import type { CreditItem } from '@/features/purchasing/supplier-payments/schemas/supplier-payment-api.schema';
import { CreateAdvanceModal } from '@/features/purchasing/supplier-payments/components/create-advance-modal';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  ACTIVE: 'Disponible',
  PARTIALLY_APPLIED: 'Parcialmente Aplicado',
  APPLIED: 'Consumido',
  REVERSED: 'Reversado',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'secondary',
  PAID: 'outline',
  ACTIVE: 'default',
  PARTIALLY_APPLIED: 'outline',
  APPLIED: 'secondary',
  REVERSED: 'destructive',
};

const TYPE_LABELS: Record<string, string> = {
  ADVANCE: 'Anticipo',
  CREDIT_NOTE: 'N. Crédito',
  DEBIT_NOTE: 'N. Débito',
};

const TYPE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  ADVANCE: 'default',
  CREDIT_NOTE: 'outline',
  DEBIT_NOTE: 'secondary',
};

export function AdvancesTabSimple() {
  const { data, isLoading } = useAllCreditsQuery();
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);

  const credits = data?.data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAdvanceModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Anticipo
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referencia</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Monto Original</TableHead>
              <TableHead>Saldo Disponible</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {credits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay anticipos ni notas de crédito registrados
                </TableCell>
              </TableRow>
            ) : (
              credits.map((credit: CreditItem) => (
                <TableRow key={credit.id}>
                  <TableCell className="font-medium">{credit.transactionNumber}</TableCell>
                  <TableCell>
                    <Badge variant={TYPE_VARIANTS[credit.transactionType] || 'secondary'}>
                      {TYPE_LABELS[credit.transactionType] || credit.transactionType}
                    </Badge>
                  </TableCell>
                  <TableCell>{credit.supplierName}</TableCell>
                  <TableCell>
                    {credit.date ? format(new Date(credit.date), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell>{formatCurrency(credit.amount, 'VES')}</TableCell>
                  <TableCell>
                    <span className={Number(credit.availableAmount) <= 0 ? 'text-muted-foreground' : 'font-medium text-emerald-600'}>
                      {formatCurrency(credit.availableAmount, 'VES')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[credit.status] || 'secondary'}>
                      {STATUS_LABELS[credit.status] || credit.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateAdvanceModal open={showAdvanceModal} onOpenChange={setShowAdvanceModal} />
    </div>
  );
}
