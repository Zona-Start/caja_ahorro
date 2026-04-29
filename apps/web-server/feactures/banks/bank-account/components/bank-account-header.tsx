'use client';

import { Heading } from '@repo/shadcn/heading';
import { OverviewLoans } from './overview-bank-account';

export function BankAccountHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Cuentas bancarias"
          description="Gestiona las cuentas bancarias de la caja de ahorro"
        />
      </div>
      <OverviewLoans />
    </>
  );
}
