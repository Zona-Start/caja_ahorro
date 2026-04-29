'use client';

import { Heading } from '@repo/shadcn/heading';

export function AccountPayableHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Cuentas por Pagar"
          description="Gestiona las cuentas por pagar"
        />
      </div>
    </>
  );
}
