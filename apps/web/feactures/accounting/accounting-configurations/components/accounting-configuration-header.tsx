'use client';

import { Heading } from '@repo/shadcn/heading';

export function AccountingConfigurationHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Configuraciones Contables"
          description="Gestiona las configuraciones contables del sistema"
        />
      </div>
    </>
  );
}
