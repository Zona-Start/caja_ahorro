'use client';

import { Heading } from '@repo/shadcn/heading';

export function PaymentBatchHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Gestión de Lotes de Pago"
          description="Administra la creación, confirmación y anulación de lotes de pago."
        />
      </div>
    </>
  );
}
