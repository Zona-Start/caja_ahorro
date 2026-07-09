import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import type { LoanListItem } from '../../../schemas/inquiry-schema';
import { LoanDetailsModal } from '../loan-details-modal';

interface CellActionProps {
  data: LoanListItem;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <LoanDetailsModal loanId={data.id} open={open} onOpenChange={setOpen} />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setOpen(true)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ver detalle</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
};
