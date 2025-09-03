'use client';

import { Heading } from '@repo/shadcn/components/ui/heading';

export function SupplierPaymentHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Pagos a Proveedores"
          description="Gestiona los pagos a proveedores"
        />
      </div>
    </>
  );
}
