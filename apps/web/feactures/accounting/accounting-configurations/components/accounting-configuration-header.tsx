'use client';

import { Heading } from '@repo/shadcn/heading';

export function AccountingConfigurationHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Reglas Contables"
          description="Gestiona las reglas contables del sistema"
        />
      </div>
    </>
  );
}
