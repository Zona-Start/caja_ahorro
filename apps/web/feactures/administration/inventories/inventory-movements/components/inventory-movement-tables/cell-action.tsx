'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Eye, Trash } from 'lucide-react'; // Added Eye icon
import { useState } from 'react';
import { useDeleteInventoryMovement } from '../../hooks/use-mutation-inventory-movement';
import { InventoryMovement } from '../../schemas/inventory-movement.schema';
import InventoryMovementModal from '../inventory-movement-modal'; // Re-import InventoryMovementModal

interface CellActionProps {
  data: InventoryMovement;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false); // New state for view modal
  const [selectedMovementData, setSelectedMovementData] = useState<InventoryMovement | null>(null); // State to hold data for view modal

  const { mutate: deleteInventoryMovement } = useDeleteInventoryMovement();

  const onConfirm = async () => {
    try {
      setLoading(true);
      deleteInventoryMovement(data.id!);
      setOpen(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = () => {
    setSelectedMovementData(data); // Set the data to be viewed
    setShowViewModal(true); // Open the view modal
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro que desea eliminar este movimiento de inventario?"
        description="Esta acción no se puede deshacer."
      />

      {selectedMovementData && ( // Render modal only if data is set
        <InventoryMovementModal
          open={showViewModal}
          onOpenChange={setShowViewModal}
          defaultValues={selectedMovementData} // Pass data to modal
          readOnly={true} // Set to read-only mode
        />
      )}

      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleViewClick} // Handle view click
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver</p>
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
