import { Heading } from '@repo/shadcn/heading';

export function BankMovementHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Movimientos Bancarios"
        description="Gestiona los movimientos de las cuentas bancarias"
      />
    </div>
  );
}
