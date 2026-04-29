'use client';

import { Heading } from '@repo/shadcn/heading';

export function BankReconciliationHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Conciliaciones Bancarias"
          description="Gestiona las conciliaciones bancarias en el sistema"
        />
      </div>
    </>
  );
}
