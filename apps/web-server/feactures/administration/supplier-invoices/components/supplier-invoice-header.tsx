'use client';

import { Heading } from '@repo/shadcn/heading';

export function SupplierInvoiceHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Facturas de Proveedores"
          description="Gestiona las facturas de proveedores"
        />
      </div>
    </>
  );
}
