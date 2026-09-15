import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { useLatestRateQuery } from '../hooks/use-exchange-rates';
import { ExchangeRatesForm } from './exchange-rates-form';

function RateCard({
  currencyCode,
  title,
}: {
  currencyCode: 'USD' | 'EUR';
  title: string;
}) {
  const { data, isLoading } = useLatestRateQuery(currencyCode);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>Última tasa registrada</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : data?.rate ? (
          <p className="text-2xl font-semibold">
            1 {currencyCode} ={' '}
            <span className="text-primary">{Number(data.rate).toFixed(6)}</span>{' '}
            Bs.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Sin tasa registrada.</p>
        )}
        {data?.rateDate && (
          <p className="text-xs text-muted-foreground mt-1">
            Fecha valor: {new Date(data.rateDate).toLocaleDateString('es-VE')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ExchangeRatesList() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Tasas de cambio</h2>
        <p className="text-sm text-muted-foreground">
          La tasa se consulta automáticamente del BCV y se mantiene durante todo
          el día. Aquí puedes fijar una tasa manualmente como respaldo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RateCard currencyCode="USD" title="Dólar (USD)" />
        <RateCard currencyCode="EUR" title="Euro (EUR)" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fijar tasa manual</CardTitle>
          <CardDescription>
            Registra manualmente la tasa del día. Si no indicas fecha, aplica a
            hoy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExchangeRatesForm />
        </CardContent>
      </Card>
    </div>
  );
}
