"use client"

import { useState } from "react"
import { LoadAssetsSearch } from "./load-asset-search"
import { LoadAssetsForm } from "./load-asset-form"
import { toast } from "@/components/use-toast"
import { Associates } from "../schemas/individual-load-api-schema"
import { useIndividualLoadMutation } from "../hooks/use-mutation-indvidual-load"
import { LoadAssest } from "../schemas/individual-load-schema"

export function LoadAssetsView() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAssociate, setSelectedAssociate] = useState<Associates | null>(null)
  const { mutate: saveIndividualLoad, isPending: isSaving } = useIndividualLoadMutation();
  const [shouldClearSearch, setShouldClearSearch] = useState(false); // Estado para limpiar el input

  // Función para manejar la selección de asociado
  const handleSelectAssociate = (associate: Associates | null) => {
    setSelectedAssociate(associate)
  }

  // Función para manejar el envío del formulario
  const handleSubmit = async (data: LoadAssest) => {
      setIsSubmitting(true)
      saveIndividualLoad(data, {
        onSuccess: () => {
          setSelectedAssociate(null)
          toast({
            title: "Haberes cargados con éxito",
            description: `Se ha registrado un depósito de ${data?.amount} ${data.currencyCode} para ${selectedAssociate?.fullname}`,
          })
          setIsSubmitting(false)
          setShouldClearSearch(true); 
        },
        onError: () => {
          toast({
            title: "Error al cargar haberes",
            description: "Ocurrió un error al procesar la operación. Intente nuevamente.",
          })
          setIsSubmitting(false)
        },
      });
  }
  

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <LoadAssetsSearch 
      shouldClearSearch={shouldClearSearch}  
      onSelectAssociate={handleSelectAssociate} 
      selectedAssociate={selectedAssociate} 
      onClearSearch={() => setShouldClearSearch(false)}
      />
      <LoadAssetsForm selectedAssociate={selectedAssociate} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
    </div>
  )
}
