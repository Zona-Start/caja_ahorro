'use client';

import { Heading } from '@repo/shadcn/heading';

export function SupplierTransactionHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Transacciones de Proveedores"
          description="Gestiona las transacciones de proveedores"
        />
      </div>
    </>
  );
}
