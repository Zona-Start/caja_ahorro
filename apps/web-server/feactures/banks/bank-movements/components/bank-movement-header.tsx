'use client';

import { Heading } from '@repo/shadcn/heading';

export function BankMovementHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Movimientos Bancarios"
          description="Cree y gestione los movimientos bancarios de la empresa."
        />
      </div>
    </>
  );
}
