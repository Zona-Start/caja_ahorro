import { useLatestRateQuery } from '@/features/core/exchange-rates/hooks/use-exchange-rates';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/shadcn/tooltip';
import { DollarSign, Euro } from 'lucide-react';

const formatRate = (rate: string | null | undefined): string => {
  if (rate === null || rate === undefined || rate === '') return '—';
  const value = Number(rate);
  if (Number.isNaN(value)) return '—';
  return value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (date: string | null | undefined): string | null => {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export function ExchangeRateBadge() {
  const { data: usd, isLoading: usdLoading } = useLatestRateQuery('USD');
  const { data: eur, isLoading: eurLoading } = useLatestRateQuery('EUR');

  const usdValue = usdLoading ? '…' : formatRate(usd?.rate);
  const eurValue = eurLoading ? '…' : formatRate(eur?.rate);

  const usdDate = formatDate(usd?.rateDate);
  const eurDate = formatDate(eur?.rateDate);
  const today = new Date().toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="hidden cursor-default items-center gap-2 rounded-full border border-border/60 bg-gradient-to-r from-muted/60 to-muted/20 px-3 py-1.5 shadow-sm sm:flex">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tasa Cambio
          </span>
          <span className="flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15">
              <DollarSign className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            </span>
            <span className="font-mono text-xs font-bold tabular-nums text-foreground">
              {usdValue}
            </span>
          </span>
          <span className="h-3.5 w-px bg-border" />
          <span className="flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/15">
              <Euro className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            </span>
            <span className="font-mono text-xs font-bold tabular-nums text-foreground">
              {eurValue}
            </span>
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-semibold">Tasa Cambio</p>
        <p>USD: {usdDate ?? today}</p>
        {eurDate && <p>EUR: {eurDate}</p>}
      </TooltipContent>
    </Tooltip>
  );
}
