export const REPORT_FILTERS_REQUIRED_MESSAGE =
  'Seleccione el ciclo contable y el rango de fechas (desde / hasta) para ver el reporte';

export function ReportFiltersRequired() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      {REPORT_FILTERS_REQUIRED_MESSAGE}
    </div>
  );
}
