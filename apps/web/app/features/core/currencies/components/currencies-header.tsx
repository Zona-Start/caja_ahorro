import { Heading } from '@repo/shadcn/heading';

interface CurrenciesHeaderProps {
  count?: number;
}

export function CurrenciesHeader({ count }: CurrenciesHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title={`Monedas (${count ?? 0})`}
        description="Gestiona las monedas del sistema"
      />
    </div>
  );
}