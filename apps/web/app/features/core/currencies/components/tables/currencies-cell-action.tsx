import { useState } from 'react';
import { AlertModal } from '@/components/shared/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react';
import { Currency } from '../../schemas/currencies.schema';
import { useDeleteCurrencyMutation } from '../../hooks/use-currencies-mutations';
import { CurrenciesModal } from '../currencies-modal';

interface CurrenciesCellActionProps {
  data: Currency;
}

export function CurrenciesCellAction({ data }: CurrenciesCellActionProps) {
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);

  const deleteMutation = useDeleteCurrencyMutation();

  const onConfirmDelete = async () => {
    try {
      setLoading(true);
      await deleteMutation.mutateAsync(data.id);
      setOpenDelete(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
        title="¿Estás seguro de eliminar esta moneda?"
        description="La moneda será eliminada del sistema."
      />

      <CurrenciesModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        defaultValues={data}
        mode="edit"
      />

      <CurrenciesModal
        open={openView}
        onOpenChange={setOpenView}
        defaultValues={data}
        mode="view"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenView(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenEdit(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setOpenDelete(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}