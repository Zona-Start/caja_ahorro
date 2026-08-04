import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Eye, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { AccountBalanceDetailModal } from '../account-balance-detail-modal';
import type { AccountingBalance } from '../../schemas/accounting-balance.schema';

interface CellActionProps {
  data: AccountingBalance;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setDetailOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver detalles
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountBalanceDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        data={data}
      />
    </>
  );
};
