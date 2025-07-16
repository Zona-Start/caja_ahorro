import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { usePurchaseOrdersCount } from '../hooks/use-query-purchase-order';

export function OverviewPurchaseOrder() {
  const { data } = usePurchaseOrdersCount();
  return (
    <div className="space-y-6 mt-4 ">
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Total Órdenes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Bs. {data?.totalAmount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {0} órdenes registradas
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
              {0} órdenes pendientes
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
              {0} órdenes pagadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Anuladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              Bs. {data?.overdueAmount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Órdenes anuladas
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}