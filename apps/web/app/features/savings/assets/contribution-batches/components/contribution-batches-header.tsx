'use client';

import { Heading } from '@repo/shadcn/heading';

interface ContributionBatchesHeaderProps {
  totalItems: number;
}

export function ContributionBatchesHeader({
  totalItems,
}: ContributionBatchesHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <Heading
        title="Historial de Cargas de Haberes"
        description={`${totalItems} registros en el historial`}
      />
    </div>
  );
}
