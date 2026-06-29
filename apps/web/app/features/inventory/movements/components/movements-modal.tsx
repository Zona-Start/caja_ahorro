import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { useMovementsModalStore } from '../store/movements-modal.store';
import { MovementsForm } from './movements-form';
import { MovementsDetail } from './movements-detail';

export function MovementsModal() {
  const { isOpen, mode, data, closeModal } = useMovementsModalStore();

  const isView = mode === 'view';
  const isEdit = mode === 'edit';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeModal(); }}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isView
              ? 'Detalle del Movimiento'
              : isEdit
                ? 'Editar Movimiento'
                : 'Nuevo Movimiento'}
          </DialogTitle>
          <DialogDescription>
            {isView
              ? 'Información detallada del movimiento de inventario.'
              : isEdit
                ? 'Modifica los datos del movimiento.'
                : 'Registra un nuevo movimiento de inventario.'}
          </DialogDescription>
        </DialogHeader>
        {isView ? (
          <MovementsDetail data={data} onClose={closeModal} />
        ) : (
          <MovementsForm
            onSuccess={closeModal}
            onCancel={closeModal}
            defaultValues={data}
            mode={mode}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
