'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Edit, Trash } from 'lucide-react';
import { useState } from 'react';
import { useDeleteCategoryType } from '../../hooks/use-mutation-category-types';
import { CategoryTypes } from '../../schemas/category-types-schemas';
import { CategoriesTypesModal } from '../categories-types-modal';

interface CellActionProps {
  data: CategoryTypes;
}

const extratingGroup = (group: string) => {
  const texto = group; // Asumiendo que data.group contiene el texto
  const palabras = texto.split(' ');
  if (palabras.length >= 2) {
    const segundaPalabra = palabras[0] ? palabras[0].toLowerCase() : ''; // Verifica si palabras[1] existe antes de convertirlo a minúsculas
    return segundaPalabra;
  } else {
    return texto.toLowerCase(); // Si no hay segunda palabra, convierte el texto completo a minúsculas
  }
};

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const { mutate: deleteCategory } = useDeleteCategoryType();

  const onConfirm = async () => {
    try {
      setLoading(true);
      deleteCategory(data.id!);
      setOpen(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const group = extratingGroup(data.group);
  const title = `¿Estás seguro que desea eliminar esta ${group}?`;

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
        title={title}
        description="Esta acción no se puede deshacer."
      />

      <CategoriesTypesModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        defaultValues={data}
        group={data.group}
      />

      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOpen(true)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eliminar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
};
