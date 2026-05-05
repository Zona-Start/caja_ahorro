import { useState } from 'react';
import { Heading } from '@repo/shadcn/heading';
import { useAssociateDetailsQuery } from '../hooks/use-inquiry-query';
import { InquirySearchCard } from '../components/inquiry-search-card';
import { AssociateDataView } from '../components/associate-data-view';
import { DetailsSkeleton } from '../components/skeletons/details-skeleton';

export function InquiryPage() {
  const [cedula, setCedula] = useState<string | null>(null);

  const { data, isLoading, isError } = useAssociateDetailsQuery(cedula as string, {
    enabled: !!cedula,
  });

  return (
    <div className="space-y-6">
      <Heading
        title="Consulta de Socio"
        description="Consulte el estado de cuenta detallado de un asociado."
      />
      <InquirySearchCard onSearch={setCedula} isLoading={isLoading} />

      {isLoading && cedula && <DetailsSkeleton />}

      {isError && cedula && (
        <div className="text-center text-destructive py-8">
          <p>Error al buscar el asociado. Intente de nuevo o verifique la cédula.</p>
        </div>
      )}

      {data && !isLoading && <AssociateDataView associate={data.data} />}
    </div>
  );
}
