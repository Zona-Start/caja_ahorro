import { Heading } from '@repo/shadcn/heading';

export function BankReconciliationHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Conciliación Bancaria"
        description="Concilia los movimientos de las cuentas bancarias: importa desde Excel o registra manualmente"
      />
    </div>
  );
}
