import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { useInvoicesPayableCount } from '../hooks/use-query-invoices-payable';

export function OverviewInvoicesPayable() {
  const { data } = useInvoicesPayableCount();
  return (
    <div className="space-y-6 mt-4 ">
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Total Facturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Bs. {data?.totalAmount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {0} facturas registradas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Pendiente de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Bs. {data?.pendingAmount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {0} facturas pendientes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Pagadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Bs. {data?.paidAmount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {0} facturas pagadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Vencidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              Bs. {data?.overdueAmount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Facturas con fecha vencida
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
