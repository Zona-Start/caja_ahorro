'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { useState } from 'react';
import { useIndividualLoadMutation } from '../hooks/use-mutation-indvidual-load';
import { Associates } from '../schemas/individual-load-api-schema';
import { LoadAssest } from '../schemas/individual-load-schema';
import { LoadAssetsForm } from './load-asset-form';
import { LoadAssetsSearch } from './load-asset-search';

export function LoadAssetsView() {
  const toast = useToastSystem();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAssociate, setSelectedAssociate] = useState<Associates | null>(
    null,
  );
  const { mutate: saveIndividualLoad, isPending: isSaving } =
    useIndividualLoadMutation();
  const [shouldClearSearch, setShouldClearSearch] = useState(false); // Estado para limpiar el input

  // Función para manejar la selección de asociado
  const handleSelectAssociate = (associate: Associates | null) => {
    setSelectedAssociate(associate);
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (data: LoadAssest) => {
    setIsSubmitting(true);
    saveIndividualLoad(data, {
      onSuccess: () => {
        setSelectedAssociate(null);
        toast.success({
          title: 'Haberes cargados con éxito',
          description: `Se ha registrado un depósito de ${data?.amount} ${data.currencyCode} para ${selectedAssociate?.fullname}`,
        });
        setIsSubmitting(false);
        setShouldClearSearch(true);
      },
      onError: () => {
        setIsSubmitting(false);
      },
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <LoadAssetsSearch
        shouldClearSearch={shouldClearSearch}
        onSelectAssociate={handleSelectAssociate}
        selectedAssociate={selectedAssociate}
        onClearSearch={() => setShouldClearSearch(false)}
      />
      <LoadAssetsForm
        selectedAssociate={selectedAssociate}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
