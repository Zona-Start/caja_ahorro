
'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Edit, Lock } from 'lucide-react';
import { useState } from 'react';
import { AccountingCycle } from '../../schemas/accounting-cycle.schema';
import { useCloseAccountingCycle } from '../../hooks/use-accounting-cycle-mutation';
import { AccountingCycleModal } from '../accounting-cycle-modal';

interface CellActionProps {
  data: AccountingCycle;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const { mutate: closeCycle } = useCloseAccountingCycle();

  const onConfirm = async () => {
    try {
      setLoading(true);
      closeCycle(data.id!);
      setOpen(false);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro que desea cerrar este ciclo contable?"
        description="Esta acción no se puede deshacer."
      />

      <AccountingCycleModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        defaultValues={data}
      />

      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowEditModal(true)}
                disabled={data.status === 'CLOSED'}
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
                disabled={data.status === 'CLOSED'}
              >
                <Lock className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cerrar Ciclo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
};
