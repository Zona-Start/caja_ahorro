'use client';

import { Heading } from '@repo/shadcn/heading';

export function WithdrawalHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Retiro Parcial de Haberes"
          description="Gestiona los retiros parciales de haberes de los Asociados"
        />
      </div>
    </>
  );
}
