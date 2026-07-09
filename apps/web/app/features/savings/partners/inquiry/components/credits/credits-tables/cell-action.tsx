import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import type { CreditListItem } from '../../../schemas/inquiry-schema';
import { CreditDetailsModal } from '../credit-details-modal';

interface CellActionProps {
  data: CreditListItem;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CreditDetailsModal
        creditId={data.id}
        open={open}
        onOpenChange={setOpen}
      />
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
