import { Heading } from '@repo/shadcn/heading';

export function BankMovementHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Movimientos Bancarios"
        description="Registra y vincula los movimientos de las cuentas bancarias con operaciones internas"
      />
    </div>
  );
}
