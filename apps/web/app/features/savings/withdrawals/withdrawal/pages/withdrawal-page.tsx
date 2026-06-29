import { useEffect, useState } from 'react';
import { Separator } from '@repo/shadcn/separator';
import { WithdrawalHeader } from '../components/withdrawal-header';
import { WithdrawalList } from '../components/withdrawal-list';
import { WithdrawalTableAction } from '../components/withdrawal-tables/withdrawal-table-action';
import { WithdrawalDetailsModal } from '../components/withdrawal-details-modal';
import { WithdrawalDesembolsarModal } from '../components/withdrawal-desembolsar-modal';
import { type WithdrawalPaymentApi } from '../schemas/withdrawal-api-response';

export default function WithdrawalPage() {
  const [viewData, setViewData] = useState<WithdrawalPaymentApi | null>(null);
  const [disburseData, setDisburseData] = useState<WithdrawalPaymentApi | null>(null);

  useEffect(() => {
    const handleView = (e: Event) => {
      setViewData((e as CustomEvent).detail);
    };
    const handleDisburse = (e: Event) => {
      setDisburseData((e as CustomEvent).detail);
    };
    window.addEventListener('withdrawal:view', handleView);
    window.addEventListener('withdrawal:disburse', handleDisburse);
    return () => {
      window.removeEventListener('withdrawal:view', handleView);
      window.removeEventListener('withdrawal:disburse', handleDisburse);
    };
  }, []);

  return (
    <div className="space-y-4">
      <WithdrawalHeader />
      <Separator />
      <WithdrawalTableAction />
      <WithdrawalList />

      <WithdrawalDetailsModal
        open={!!viewData}
        onOpenChange={(v) => { if (!v) setViewData(null); }}
        data={viewData}
      />

      <WithdrawalDesembolsarModal
        open={!!disburseData}
        onOpenChange={(v) => { if (!v) setDisburseData(null); }}
        data={disburseData}
      />
    </div>
  );
}
