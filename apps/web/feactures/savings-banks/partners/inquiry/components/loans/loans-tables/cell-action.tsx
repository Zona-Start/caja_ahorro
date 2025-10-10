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
import { loansResponseSchema } from '../../../schemas/inquiry-schema';
import { LoanDetailsModal } from '../loan-details-modal';

type Loan = z.infer<typeof loansResponseSchema>['data'][number];

interface CellActionProps {
  data: Loan;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <LoanDetailsModal loanId={data.id} open={open} onOpenChange={setOpen} />
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
