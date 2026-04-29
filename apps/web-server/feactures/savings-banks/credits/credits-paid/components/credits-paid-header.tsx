'use client';

import { Heading } from '@repo/shadcn/heading';

export function CreditsPaidHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Pago de Cuotas de Créditos"
          description="Gestiona los pagos de Créditos de los Asociados"
        />
      </div>
    </>
  );
}
