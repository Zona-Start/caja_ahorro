'use client';

import { Heading } from '@repo/shadcn/heading';
import { OverviewInvoicesPayable } from './overview-invoices-payable';

export function InvoicePayableHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Cuentas por Pagar"
          description="Gestiona las cuentas por pagar de la caja de ahorro"
        />
      </div>
      <OverviewInvoicesPayable />
    </>
  );
}
