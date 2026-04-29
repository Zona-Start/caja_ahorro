'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { Heading } from '@repo/shadcn/heading';
import { Toaster } from '@repo/shadcn/toaster';
import { useEffect, useState } from 'react';
import { AssociateDataView } from './components/associate-data-view';
import { InquirySearchCard } from './components/inquiry-search-card';
import { DetailsSkeleton } from './components/skeletons/details-skeleton';
import { useAssociateDetails } from './hooks/use-inquiry-queries';

export default function InquiryPage() {
  const toast = useToastSystem();
  const [cedula, setCedula] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useAssociateDetails(cedula);

  useEffect(() => {
    if (isError && cedula) {
      toast.error({
        title: 'Error de Búsqueda',
        description: 'Error al buscar la cédula',
      });
    }
  }, [isError, cedula, error, toast]);

  return (
    <div className="space-y-6">
      <Toaster />
      <Heading
        title="Consulta de Socio"
        description="Consulte el estado de cuenta detallado de un asociado."
      />
      <InquirySearchCard onSearch={setCedula} isLoading={isLoading} />

      {isLoading && cedula && <DetailsSkeleton />}

      {isError && cedula && (
        <div className="text-center text-red-500 dark:text-red-400 py-8">
          <p>Intente de nuevo o verifique la cédula.</p>
        </div>
      )}

      {data && !isLoading && <AssociateDataView associate={data.data} />}
    </div>
  );
}
