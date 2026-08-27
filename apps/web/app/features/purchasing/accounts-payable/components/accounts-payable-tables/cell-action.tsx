import { useState } from 'react';
import { AlertModal } from '@/components/shared/alert-modal';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { CheckCircle, Eye, MoreHorizontal } from 'lucide-react';
import { useAuthorizeAccountsPayableMutation } from '../../hooks/use-accounts-payable-mutations';
import type { AccountsPayableApi } from '../../schemas/accounts-payable-api.schema';
import { AccountsPayableViewModal } from './accounts-payable-view-modal';
import { useAuthStore } from '@/stores/auth.store';

interface CellActionProps {
  data: AccountsPayableApi;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openAuthorize, setOpenAuthorize] = useState(false);
  const [openView, setOpenView] = useState(false);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const { mutateAsync: authorize } = useAuthorizeAccountsPayableMutation();

  const isPending = data.status === 'PENDING';

  const onConfirm = async () => {
    try {
      setLoading(true);
      await authorize(data.id);
      setOpenAuthorize(false);
    } catch {
      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={openAuthorize}
        onClose={() => setOpenAuthorize(false)}
        onConfirm={onConfirm}
        loading={loading}
        title="¿Estás seguro de autorizar esta cuenta por pagar?"
        description="Una vez autorizada, la cuenta por pagar estará disponible para su pago."
      />

      <AccountsPayableViewModal
        open={openView}
        onOpenChange={setOpenView}
        accountId={openView ? data.id : undefined}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpenView(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalles
          </DropdownMenuItem>
          {isPending && hasPermission('purchasing:accounts_payable', 'process') && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOpenAuthorize(true)}
                className="text-green-600 focus:text-green-600 focus:bg-green-50"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Autorizar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};


