import { useState } from 'react';
import { Heading } from '@repo/shadcn/heading';
import { useStatementQuery } from '../hooks/use-inquiry-query';
import { InquirySearchCard } from '../components/inquiry-search-card';
import { AssociateDataView } from '../components/associate-data-view';
import { DetailsSkeleton } from '../components/skeletons/details-skeleton';

export function InquiryPage() {
  const [cedula, setCedula] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useStatementQuery(cedula);

  return (
    <div className="space-y-6">
      <Heading
        title="Consulta de Socio"
        description="Consulte el estado de cuenta detallado de un asociado."
      />
      <InquirySearchCard onSearch={setCedula} isLoading={isLoading} />

      {isLoading && cedula && <DetailsSkeleton />}

      {isError && cedula && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <p className="text-destructive font-medium">
            {error instanceof Error ? error.message : 'Error al buscar el asociado. Verifique la cédula e intente de nuevo.'}
          </p>
        </div>
      )}

      {data && !isLoading && <AssociateDataView associate={data.data} />}
    </div>
  );
}
