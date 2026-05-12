import { Heading } from '@repo/shadcn/heading';

export function SupplierInvoicesHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Facturas de Proveedores"
        description="Gestiona las facturas recibidas de proveedores"
      />
    </div>
  );
}
