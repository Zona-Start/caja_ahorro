'use client';

import { Heading } from '@repo/shadcn/heading';

export function PurchaseOrderHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Órdenes de Compra"
          description="Gestiona las órdenes de compra"
        />
      </div>
    </>
  );
}
