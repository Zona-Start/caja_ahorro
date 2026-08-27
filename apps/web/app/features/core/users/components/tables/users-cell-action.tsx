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
import { User } from '../../schemas/users.schema';
import { useDeleteUserMutation } from '../../hooks/use-users-mutations';
import { UsersModal } from '../users-modal';
import { UsersViewModal } from '../users-view-modal';
import { useAuthStore } from '@/stores/auth.store';

interface UsersCellActionProps {
  data: User;
}

export function UsersCellAction({ data }: UsersCellActionProps) {
  const [loading, setLoading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const getDefaultValuesForEdit = () => {
    const firstMember = data.tenantMembers?.[0];
    return {
      ...data,
      tenantId: firstMember?.tenant?.id || '',
      roleId: firstMember?.role?.id || '',
    };
  };

  const deleteMutation = useDeleteUserMutation();

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
        title="¿Estás seguro de eliminar este usuario?"
        description="El usuario será eliminado del sistema."
      />

      <UsersModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        defaultValues={getDefaultValuesForEdit()}
        mode="edit"
      />

      <UsersViewModal
        open={openView}
        onOpenChange={setOpenView}
        data={data}
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
          {hasPermission('iam:users', 'update') && (
            <DropdownMenuItem onClick={() => setOpenEdit(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {hasPermission('iam:users', 'delete') && (
            <DropdownMenuItem
              onClick={() => setOpenDelete(true)}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}