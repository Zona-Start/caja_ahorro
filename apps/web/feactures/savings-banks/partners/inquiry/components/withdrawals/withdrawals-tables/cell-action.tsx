'use client';

import { Button } from '@repo/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/shadcn/tooltip';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { withdrawalsResponseSchema } from '../../../schemas/inquiry-schema';
import { WithdrawalDetailsModal } from '../withdrawal-details-modal';

type Withdrawal = z.infer<typeof withdrawalsResponseSchema>['data'][number];

interface CellActionProps {
  data: Withdrawal;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <WithdrawalDetailsModal withdrawalId={data.id} open={open} onOpenChange={setOpen} />
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
