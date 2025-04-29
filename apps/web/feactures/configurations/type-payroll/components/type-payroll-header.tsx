'use client';

import { Heading } from '@repo/shadcn/heading';

export function TypePayrollHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Tipos de Nomina"
          description="Gestiona los tipos de nomina"
        />
      </div>
    </>
  );
}
