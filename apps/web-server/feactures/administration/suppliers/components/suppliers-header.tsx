'use client';

import { Heading } from '@repo/shadcn/heading';
import { OverviewSuppliers } from './overview-suppliers';

export function SupplierHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Proveedores"
          description="Gestiona los proveedores de la caja de ahorro"
        />
      </div>
      <OverviewSuppliers />
    </>
  );
}
