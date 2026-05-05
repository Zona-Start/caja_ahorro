import { useState } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { type creditSchema } from '../../../schemas/inquiry-schema';
import { z } from 'zod';
import { CreditDetailsModal } from '../credit-details-modal';

type Credit = z.infer<typeof creditSchema>;

interface CellActionProps {
  data: Credit;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CreditDetailsModal creditId={data.id} open={open} onOpenChange={setOpen} />
      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={() => setOpen(true)}>
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
};
