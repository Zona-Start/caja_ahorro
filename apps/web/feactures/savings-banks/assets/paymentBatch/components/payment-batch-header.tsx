'use client';

import { Heading } from '@repo/shadcn/heading';

export function PaymentBatchHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Lote de Pago"
          description="Gestiona los lotes de pago de los Asociados"
        />
      </div>
    </>
  );
}
