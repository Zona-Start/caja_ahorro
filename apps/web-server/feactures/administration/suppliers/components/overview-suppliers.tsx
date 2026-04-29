import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { useSupplierCount } from '../hooks/use-query-suppliers';

export function OverviewSuppliers() {
  const { data } = useSupplierCount();
  return (
    <div className="space-y-6 mt-4 ">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Total Proveedores Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {/* Aquí iría el número de proveedores activos */}
              {data?.totalActive || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Total Proveedores Inactivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {/* Aquí iría el monto total de cuentas por pagar pendientes */}
              {data?.totalInactive || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">
              Total Proveedores Suspendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {/* Aquí iría el monto total de cuentas por pagar pendientes */}
              {data?.totalSupended || 0}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
