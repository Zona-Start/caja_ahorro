import { Heading } from '@repo/shadcn/heading';

export function SupplierPaymentsHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Pagos a Proveedores"
        description="Gestiona los pagos realizados a proveedores"
      />
    </div>
  );
}
