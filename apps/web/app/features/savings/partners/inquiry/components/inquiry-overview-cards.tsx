import { formatCurrency } from '@/lib/format-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { DollarSign, PiggyBank, TrendingUp, Wallet } from 'lucide-react';
import { type AssociateDetails } from '../schemas/inquiry-schema';

interface InquiryOverviewCardsProps {
  associate: AssociateDetails;
}

export function InquiryOverviewCards({ associate }: InquiryOverviewCardsProps) {
  const availability = parseFloat(associate.totalHaberes) * 0.8;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sueldo Base</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl text-blue-700 font-bold">
            {formatCurrency(Number(associate.baseSalary), 'VES')}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Capacidad de Pago
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl text-orange-500 font-bold">
            {formatCurrency(Number(associate.paymentCapacity), 'VES')}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Haberes Totales</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl text-red-600 font-bold">
            {formatCurrency(Number(associate.totalHaberes), 'VES')}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Disponibilidad</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl text-green-600 font-bold">
            {formatCurrency(availability, 'VES')}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
