'use client';

import { useState } from 'react';
import { Heading } from '@repo/shadcn/heading';
import { ContributionBatchesTableAction } from '../../contribution-batches/components/contribution-batches-table/contribution-batches-table-action';
import { ContributionBatchesList } from '../../contribution-batches/components/contribution-batches-list';
import { CargaIndividualModal } from '../../contribution-batches/components/carga-individual-modal';
import { CargaMasivaModal } from '../../contribution-batches/components/carga-masiva-modal';
import { useContributionBatchesFilters } from '../../contribution-batches/hooks/use-contribution-batches-filters';

export function IndividualLoadPage() {
  const { filters, setFilters } = useContributionBatchesFilters();

  const [indivOpen, setIndivOpen] = useState(false);
  const [massOpen, setMassOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Heading
        title="Carga de Haberes"
        description="Gestione los haberes individuales y masivos de los asociados"
      />

      <ContributionBatchesTableAction
        filters={filters}
        setFilters={setFilters}
        onCargaIndividual={() => setIndivOpen(true)}
        onCargaMasiva={() => setMassOpen(true)}
      />
      <ContributionBatchesList filters={filters} />

      <CargaIndividualModal open={indivOpen} onClose={() => setIndivOpen(false)} />
      <CargaMasivaModal open={massOpen} onClose={() => setMassOpen(false)} />
    </div>
  );
}

export default IndividualLoadPage;
