import { useToastSystem } from '@/hooks/use-toast-system';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useIndividualLoadMutation } from '../hooks/use-individual-load-mutation';
import { useIndividualLoadStore } from '../store/individual-load-store';

import { LoadAssetsBulk } from './load-asset-bulk';
import { LoadAssetsForm } from './load-asset-form';
import { LoadAssetsSearch } from './load-asset-search';

export function LoadAssetsView() {
  const toast = useToastSystem();
  const { selectedAssociate, clearAll } = useIndividualLoadStore();
  const { mutate: saveIndividualLoad, isPending: isSaving } =
    useIndividualLoadMutation();

  const [activeTab, setActiveTab] = useState('individual');

  useEffect(() => {
    return () => {
      clearAll();
    };
  }, [clearAll]);

  const handleSubmitIndividual = async (data: unknown) => {
    saveIndividualLoad(data as Parameters<typeof saveIndividualLoad>[0], {
      onSuccess: () => {
        const fullname = selectedAssociate?.fullname;
        clearAll();
        toast.success({
          title: 'Haberes cargados con éxito',
          description: `Se ha registrado el depósito para ${fullname}`,
        });
      },
      onError: (error: unknown) => {
        const err = error as { message?: string };
        toast.error({
          title: 'Error en la operación',
          description:
            err?.message || 'No se pudo completar la carga de haberes.',
        });
      },
    });
  };

  return (
    <div className="w-full space-y-6">
      <Tabs
        defaultValue="individual"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Carga Individual
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Carga Masiva
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <LoadAssetsSearch />
            <LoadAssetsForm
              isSubmitting={isSaving}
              onSubmit={handleSubmitIndividual}
            />
          </div>
        </TabsContent>

        <TabsContent value="batch" className="mt-6">
          <LoadAssetsBulk />
        </TabsContent>
      </Tabs>
    </div>
  );
}