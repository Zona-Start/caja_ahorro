'use client';

import { Heading } from '@repo/shadcn/heading';

export function AccountingCycleHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Ciclos Contables"
          description="Gestiona los ciclos contables de la empresa"
        />
      </div>
    </>
  );
}
