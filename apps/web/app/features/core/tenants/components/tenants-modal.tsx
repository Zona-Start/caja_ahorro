import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { TenantMutation, Tenant } from '../schemas/tenants.schema';
import { useTenantsModalStore } from '../store/tenants-modal-store';
import { TenantsForm } from './tenants-form';

/** Strips null values to undefined so Tenant data is compatible with TenantMutation */
function toFormValues(tenant: Tenant): Partial<TenantMutation> {
  return Object.fromEntries(
    Object.entries(tenant).map(([key, value]) => [
      key,
      value === null ? undefined : value,
    ]),
  ) as Partial<TenantMutation>;
}

export function TenantsModal() {
  const { isOpen, mode, data, closeModal } = useTenantsModalStore();

  const handleSuccess = () => {
    closeModal();
  };

  const handleCancel = () => {
    closeModal();
  };

  const isEditMode = mode === 'edit';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Actualiza la información del cliente.'
              : 'Crea un nuevo cliente para el sistema.'}
          </DialogDescription>
        </DialogHeader>
        <TenantsForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={data ? toFormValues(data) : undefined}
        />
      </DialogContent>
    </Dialog>
  );
}
