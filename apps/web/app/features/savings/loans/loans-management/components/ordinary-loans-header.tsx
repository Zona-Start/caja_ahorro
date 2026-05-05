'use client';

import { Heading } from '@repo/shadcn/heading';
import { OverviewLoans } from './overview-loans';

export function LoansHeader() {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <Heading
          title="Préstamos"
          description="Gestiona los Préstamos de los Asociados"
        />
      </div>
      <OverviewLoans />
    </div>
  );
}
