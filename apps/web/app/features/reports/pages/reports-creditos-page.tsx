import { useState } from 'react';
import { CreditCard, ListChecks } from 'lucide-react';
import { ReportCard } from '../components/report-card';
import { CreditsReportModal } from '../components/modals/credits-report-modal';
import { CreditQuotasReportModal } from '../components/modals/credit-quotas-report-modal';

export default function ReportsCreditosPage() {
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [isCreditQuotasModalOpen, setIsCreditQuotasModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Créditos</h1>
        <p className="text-muted-foreground">
          Reportes disponibles del módulo de Créditos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ReportCard
          title="Créditos"
          description="Reporte general de créditos solicitados"
          icon={CreditCard}
          onClick={() => setIsCreditsModalOpen(true)}
        />
        <ReportCard
          title="Cuotas"
          description="Reporte de cuotas de créditos por cobrar"
          icon={ListChecks}
          onClick={() => setIsCreditQuotasModalOpen(true)}
        />
      </div>

      <CreditsReportModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
      />
      <CreditQuotasReportModal
        isOpen={isCreditQuotasModalOpen}
        onClose={() => setIsCreditQuotasModalOpen(false)}
      />
    </div>
  );
}
