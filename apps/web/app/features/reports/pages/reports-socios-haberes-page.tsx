import { useState } from 'react';
import { Users, Upload, ArrowUpFromLine, BarChart3 } from 'lucide-react';
import { ReportCard } from '../components/report-card';
import { AssociatesReportModal } from '../components/modals/associates-report-modal';
import { HaberesReportModal } from '../components/modals/haberes-report-modal';
import { WithdrawalsReportModal } from '../components/modals/withdrawals-report-modal';
import { VariationsReportModal } from '../components/modals/variations-report-modal';

export default function ReportsSociosHaberesPage() {
  const [isAssociatesModalOpen, setIsAssociatesModalOpen] = useState(false);
  const [isHaberesModalOpen, setIsHaberesModalOpen] = useState(false);
  const [isWithdrawalsModalOpen, setIsWithdrawalsModalOpen] = useState(false);
  const [isVariationsModalOpen, setIsVariationsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Socios y Haberes</h1>
        <p className="text-muted-foreground">
          Reportes disponibles del módulo de Socios y Haberes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ReportCard
          title="Listado de Socios"
          description="Reporte general de todos los asociados"
          icon={Users}
          onClick={() => setIsAssociatesModalOpen(true)}
        />
        <ReportCard
          title="Cargas de Haberes"
          description="Reporte de cargas de haberes realizadas"
          icon={Upload}
          onClick={() => setIsHaberesModalOpen(true)}
        />
        <ReportCard
          title="Retiros de Haberes"
          description="Reporte de retiros de haberes realizados"
          icon={ArrowUpFromLine}
          onClick={() => setIsWithdrawalsModalOpen(true)}
        />
        <ReportCard
          title="Variaciones"
          description="Cuotas por cobrar préstamos a socio"
          icon={BarChart3}
          onClick={() => setIsVariationsModalOpen(true)}
        />
      </div>

      <AssociatesReportModal
        isOpen={isAssociatesModalOpen}
        onClose={() => setIsAssociatesModalOpen(false)}
      />
      <HaberesReportModal
        isOpen={isHaberesModalOpen}
        onClose={() => setIsHaberesModalOpen(false)}
      />
      <WithdrawalsReportModal
        isOpen={isWithdrawalsModalOpen}
        onClose={() => setIsWithdrawalsModalOpen(false)}
      />
      <VariationsReportModal
        isOpen={isVariationsModalOpen}
        onClose={() => setIsVariationsModalOpen(false)}
      />
    </div>
  );
}
