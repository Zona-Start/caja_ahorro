'use client';

import { Heading } from '@repo/shadcn/heading';

export function PaymentBatchHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Desembolsos por Lote"
          description="Gestiona los lotes de desembolsos de los Asociados"
        />
      </div>
    </>
  );
}
