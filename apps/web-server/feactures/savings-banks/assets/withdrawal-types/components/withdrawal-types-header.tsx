'use client';

import { Heading } from '@repo/shadcn/heading';

export function WithdrawalTypesHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Tipos de Rétiros"
          description="Gestiona los tipos de rétiros del sistema"
        />
      </div>
    </>
  );
}
