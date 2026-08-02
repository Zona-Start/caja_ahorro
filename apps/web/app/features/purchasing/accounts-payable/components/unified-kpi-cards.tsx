import { Card, CardContent } from '@repo/shadcn/card';
import { formatCurrency } from '@/lib/format-utils';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Wallet, FileWarning } from 'lucide-react';
import { supplierPaymentsService } from '@/features/purchasing/supplier-payments/services/supplier-payments-service';
import { accountsPayableService } from '../services/accounts-payable-service';

export function UnifiedKpiCards() {
  const { data: credits } = useQuery({
    queryKey: ['supplier-payments', 'all-credits'],
    queryFn: () => supplierPaymentsService.getAllCredits(),
  });

  const { data: cxpData } = useQuery({
    queryKey: ['accounts-payable', 'kpi'],
    queryFn: () => accountsPayableService.getAll({ page: 1, limit: 1, search: '', status: 'APPROVED,PARTIALLY_PAID' }),
  });

  const totalCxp = cxpData?.meta?.totalCount || 0;
  const summary = credits?.data?.summary;

  return (
    <div className="flex gap-3">
      <Card className="border-red-200 bg-red-50 dark:bg-red-950 flex-1">
        <CardContent className="p-4 flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-red-600" />
          <div>
            <p className="text-xs text-muted-foreground">Total a Pagar</p>
            <p className="text-xl font-bold text-red-700">{formatCurrency(0, 'VES')}</p>
            <p className="text-[10px] text-muted-foreground">{totalCxp} facturas</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950 flex-1">
        <CardContent className="p-4 flex items-center gap-3">
          <Wallet className="h-8 w-8 text-emerald-600" />
          <div>
            <p className="text-xs text-muted-foreground">Anticipos Disponibles</p>
            <p className="text-xl font-bold text-emerald-700">
              {formatCurrency(summary?.totalAvailable ?? 0, 'VES')}
            </p>
            <p className="text-[10px] text-muted-foreground">{summary?.advanceCount ?? 0} anticipos</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 flex-1">
        <CardContent className="p-4 flex items-center gap-3">
          <FileWarning className="h-8 w-8 text-purple-600" />
          <div>
            <p className="text-xs text-muted-foreground">Notas de Crédito</p>
            <p className="text-xl font-bold text-purple-700">{summary?.creditNoteCount ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">por aplicar</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
