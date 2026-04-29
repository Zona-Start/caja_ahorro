'use client';

import { Heading } from '@repo/shadcn/heading';

export function LoansPaidHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Pago de Cuotas de Préstamos"
          description="Gestiona los pagos de Préstamos de los Asociados"
        />
      </div>
    </>
  );
}
