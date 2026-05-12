'use client';

import { Heading } from '@repo/shadcn/heading';

export function LoansPaidHeader() {
  return (
    <div className="flex items-start justify-between">
      <Heading
        title="Pagos de Préstamos"
        description="Gestión y registro de pagos de préstamos de los asociados"
      />
    </div>
  );
}
