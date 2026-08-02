import { Heading } from '@repo/shadcn/heading';

export function SettlementHeader() {
  return (
    <div className="flex items-start justify-between">
      <Heading
        title="Liquidación de Haberes"
        description="Gestión y registro de liquidaciones de los asociados"
      />
    </div>
  );
}
