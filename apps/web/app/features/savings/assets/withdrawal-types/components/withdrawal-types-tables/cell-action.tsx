import { useState } from 'react';
import { Edit, Trash } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { useDeleteWithdrawalTypeMutation } from '../../hooks/use-withdrawal-types-query';
import { type WithdrawalTypes } from '../../schemas/withdrawal-types.schema';
import { WithdrawalTypesModal } from '../withdrawal-types-modal';
// Assuming AlertModal exists or I'll create it later. For now, I'll use window.confirm or skip it.
// Wait, I should create AlertModal if it doesn't exist in web/app/components/modal/alert-modal.tsx.

interface CellActionProps {
  data: WithdrawalTypes;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [mode, setMode] = useState(false);

  const { mutate: deleteWithdrawalType } = useDeleteWithdrawalTypeMutation();

  const onDelete = () => {
    if (window.confirm('¿Estás seguro que desea eliminar este tipo de rétiro? Esta acción no se puede deshacer.')) {
      deleteWithdrawalType(data.id!);
    }
  };

  return (
    <>
      <WithdrawalTypesModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        defaultValues={data}
        readOnly={mode}
      />

      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setMode(false);
                  setShowEditModal(true);
                }}
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
                onClick={onDelete}
              >
                <Trash className="h-4 w-4 text-destructive" />
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
