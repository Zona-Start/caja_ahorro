'use client';

import { Heading } from '@repo/shadcn/heading';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import { Toaster } from '@repo/shadcn/toaster';
import { useEffect, useState } from 'react';
import { AssociateDataView } from './components/associate-data-view';
import { InquirySearchCard } from './components/inquiry-search-card';
import { DetailsSkeleton } from './components/skeletons/details-skeleton';
import { useAssociateDetails } from './hooks/use-inquiry-queries';

export default function InquiryPage() {
  const [cedula, setCedula] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useAssociateDetails(cedula);
  const { toast } = useToast();

  useEffect(() => {
    if (isError && cedula) {
      toast({
        variant: 'destructive',
        title: 'Error de Búsqueda',
        description:
          error?.message ||
          'La cédula no se encuentra registrada o el asociado está inactivo.',
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
