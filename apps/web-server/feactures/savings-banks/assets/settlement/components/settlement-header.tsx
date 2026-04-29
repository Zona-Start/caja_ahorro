'use client';

import { Heading } from '@repo/shadcn/heading';

export function SettlementHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Liquidación de Haberes"
          description="Gestiona las liquidaciones de haberes de los Asociados"
        />
      </div>
    </>
  );
}
