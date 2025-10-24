'use client';

import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { CreditCard, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { ReportDebtModal } from './report-debt-modal';

type ReportType =
  | 'associates'
  | 'debts'
  | 'payments'
  | 'activity'
  | 'monthly'
  | 'balance'
  | 'status'
  | 'overdue';

export default function ReportsAssociatePage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [openReportModal, setOpenReportModal] = useState(false);

  const reports = [
    {
      id: 'associates' as ReportType,
      title: 'Reporte de Asociados',
      description: 'Lista completa de asociados registrados',
      icon: Users,
      color: 'text-blue-500',
    },
    {
      id: 'debts' as ReportType,
      title: 'Deudas de Asociados',
      description: 'Resumen de deudas pendientes (Variaciones)',
      icon: DollarSign,
      color: 'text-red-500',
      function: () => setOpenReportModal(true),
    },
    {
      id: 'payments' as ReportType,
      title: 'Historial de Retiros',
      description: 'Registro de retiros realizados',
      icon: CreditCard,
      color: 'text-green-500',
    },
    {
      id: 'activity' as ReportType,
      title: 'Actividad de Asociados',
      description: 'Seguimiento de actividades',
      icon: TrendingUp,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Centro de Reportes Socios
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Selecciona un reporte para generar y configurar los parámetros
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className="group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
                onClick={() => setSelectedReport(report.id)}
              >
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    <Icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {report.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full hover:bg-primary hover:text-white dark:hover:bg-primary "
                    onClick={report.function}
                  >
                    Generar Reporte
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      <ReportDebtModal
        open={openReportModal}
        onOpenChange={setOpenReportModal}
      />
    </div>
  );
}
