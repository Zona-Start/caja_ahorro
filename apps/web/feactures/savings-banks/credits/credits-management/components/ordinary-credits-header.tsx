'use client';

import { Heading } from '@repo/shadcn/heading';
import { OverviewLoans } from './overview-credits';

export function CreditsHeader() {
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <Heading
          title="Créditos"
          description="Gestiona los Créditos de los Asociados"
        />
      </div>
      <OverviewLoans />
    </>
  );
}
