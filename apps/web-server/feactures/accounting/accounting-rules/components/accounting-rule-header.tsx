'use client';

import { Heading } from '@repo/shadcn/heading';

export function AccountingRuleHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Reglas Contables"
          description="Gestiona las reglas de contabilización automática"
        />
      </div>
    </>
  );
}
