'use client';

import { Heading } from '@repo/shadcn/heading';
import { OverviewLoans } from './overview-loans';

export function AssociatesHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Préstamos"
          description="Gestiona los Préstamos de los Asociados"
        />
      </div>
      <OverviewLoans />
    </>
  );
}
