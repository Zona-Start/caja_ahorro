import { Heading } from '@repo/shadcn/heading';

export function AccountingCycleHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Ciclos Contables"
        description="Gestiona los periodos contables de tu empresa"
      />
    </div>
  );
}
