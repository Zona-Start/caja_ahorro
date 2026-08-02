import { useEffect, useState } from 'react';
import { Separator } from '@repo/shadcn/separator';
import { SettlementHeader } from '../components/settlement-header';
import { SettlementList } from '../components/settlement-list';
import { SettlementTableAction } from '../components/settlement-tables/settlement-table-action';
import { SettlementDetailsModal } from '../components/settlement-details-modal';
import { SettlementDesembolsarModal } from '../components/settlement-desembolsar-modal';
import { type SettlementPaymentApi } from '../schemas/settlement-api-response';

export default function SettlementListPage() {
  const [viewData, setViewData] = useState<SettlementPaymentApi | null>(null);
  const [disburseData, setDisburseData] =
    useState<SettlementPaymentApi | null>(null);

  useEffect(() => {
    const handleView = (e: Event) => {
      setViewData((e as CustomEvent).detail);
    };
    const handleDisburse = (e: Event) => {
      setDisburseData((e as CustomEvent).detail);
    };
    window.addEventListener('settlement:view', handleView);
    window.addEventListener('settlement:disburse', handleDisburse);
    return () => {
      window.removeEventListener('settlement:view', handleView);
      window.removeEventListener('settlement:disburse', handleDisburse);
    };
  }, []);

  return (
    <div className="space-y-4">
      <SettlementHeader />
      <Separator />
      <SettlementTableAction />
      <SettlementList />

      <SettlementDetailsModal
        open={!!viewData}
        onOpenChange={(v) => {
          if (!v) setViewData(null);
        }}
        data={viewData}
      />

      <SettlementDesembolsarModal
        open={!!disburseData}
        onOpenChange={(v) => {
          if (!v) setDisburseData(null);
        }}
        data={disburseData}
      />
    </div>
  );
}
