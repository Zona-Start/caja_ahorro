import { formatCurrency } from '@/lib/format-utils';
import { Card, CardContent } from '@repo/shadcn/card';
import {
  DollarSign,
  TrendingUp,
  PiggyBank,
  Wallet,
} from 'lucide-react';
import type { AssociateStatement } from '../schemas/inquiry-schema';

interface InquiryOverviewCardsProps {
  associate: AssociateStatement;
}

export function InquiryOverviewCards({ associate }: InquiryOverviewCardsProps) {
  const cards = [
    {
      title: 'Sueldo Base',
      value: Number(associate.baseSalary),
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950',
      border: 'border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Capacidad de Pago',
      value: Number(associate.paymentCapacity),
      icon: TrendingUp,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950',
      border: 'border-amber-200 dark:border-amber-800',
      subtitle: '30% del sueldo',
    },
    {
      title: 'Haberes Totales',
      value: Number(associate.totalHaberes),
      icon: PiggyBank,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      title: 'Disponibilidad',
      value: Number(associate.disponibility),
      icon: Wallet,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950',
      border: 'border-violet-200 dark:border-violet-800',
      subtitle: '80% de haberes',
    },
  ];

  return (
    <>
      {cards.map((card) => (
        <Card
          key={card.title}
          className={`${card.border} border ${card.bg} shadow-sm hover:shadow-md transition-shadow`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {card.title}
              </p>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className={`mt-2 text-2xl font-bold ${card.color}`}>
              {formatCurrency(card.value, 'VES')}
            </div>
            {card.subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">
                {card.subtitle}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
