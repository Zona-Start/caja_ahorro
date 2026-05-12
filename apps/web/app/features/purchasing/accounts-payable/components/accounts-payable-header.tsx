import { Heading } from '@repo/shadcn/heading';

export function AccountsPayableHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Cuentas por Pagar"
        description="Gestiona las cuentas por pagar a proveedores"
      />
    </div>
  );
}
