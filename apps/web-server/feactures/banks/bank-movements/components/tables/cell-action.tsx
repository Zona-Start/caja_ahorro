'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@repo/shadcn/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/components/ui/tooltip';
import { Eye, Link2Off, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useReverseMovement } from '../../hooks/use-reverse-movement';
import { useUnlinkMovement } from '../../hooks/use-unlink-movement';
import { BankMovementColumn } from './columns';

interface CellActionProps {
  data: BankMovementColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<'unlink' | 'reverse' | null>(null);

  const { mutate: unlinkMovement, isPending: isUnlinking } =
    useUnlinkMovement();
  const { mutate: reverseMovement, isPending: isReversing } =
    useReverseMovement();

  const onConfirm = () => {
    if (action === 'unlink') {
      unlinkMovement(data.id);
    } else if (action === 'reverse') {
      // For reversing, we might need a more complex modal to get reason and date
      // For now, using a simple confirmation and placeholder values
      reverseMovement({
        id: data.id,
        reason: 'Reversión por error',
        valueDate: new Date().toISOString(),
      });
    }
    setOpen(false);
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={isUnlinking || isReversing}
        title={`¿Estás seguro de ${action === 'unlink' ? 'desvincular' : 'reversar'} este movimiento?`}
        description="Esta acción no se puede deshacer."
      />
      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon">
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
                onClick={() => {
                  setAction('unlink');
                  setOpen(true);
                }}
                disabled={data.internalLinkStatus !== 'LINKED'}
              >
                <Link2Off className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Desvincular</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setAction('reverse');
                  setOpen(true);
                }}
                disabled={data.reconciliationStatus !== 'RECONCILED'}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reversar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
};
