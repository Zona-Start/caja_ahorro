import { Heading } from '@repo/shadcn/heading';

export function AccountingBalanceHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Saldos Contables"
        description="Gestiona los saldos contables de tu empresa"
      />
    </div>
  );
}
