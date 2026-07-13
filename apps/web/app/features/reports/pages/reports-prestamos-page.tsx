import { useState } from 'react';
import { HandCoins, ListChecks } from 'lucide-react';
import { ReportCard } from '../components/report-card';
import { LoansReportModal } from '../components/modals/loans-report-modal';
import { QuotasReportModal } from '../components/modals/quotas-report-modal';

export default function ReportsPrestamosPage() {
  const [isLoansModalOpen, setIsLoansModalOpen] = useState(false);
  const [isQuotasModalOpen, setIsQuotasModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Préstamos</h1>
        <p className="text-muted-foreground">
          Reportes disponibles del módulo de Préstamos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ReportCard
          title="Préstamos"
          description="Reporte general de préstamos solicitados"
          icon={HandCoins}
          onClick={() => setIsLoansModalOpen(true)}
        />
        <ReportCard
          title="Cuotas"
          description="Reporte de cuotas de préstamos por cobrar"
          icon={ListChecks}
          onClick={() => setIsQuotasModalOpen(true)}
        />
      </div>

      <LoansReportModal
        isOpen={isLoansModalOpen}
        onClose={() => setIsLoansModalOpen(false)}
      />
      <QuotasReportModal
        isOpen={isQuotasModalOpen}
        onClose={() => setIsQuotasModalOpen(false)}
      />
    </div>
  );
}
