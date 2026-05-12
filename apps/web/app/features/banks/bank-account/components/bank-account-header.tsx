import { Heading } from '@repo/shadcn/heading';

export function BankAccountHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Cuentas Bancarias"
        description="Gestiona las cuentas bancarias de tu empresa"
      />
    </div>
  );
}
