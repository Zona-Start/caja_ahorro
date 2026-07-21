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
import { formatCurrency } from '@/lib/format-utils';
import { useAccountsPayableDetailQuery } from '../../hooks/use-accounts-payable-queries';
import { useAuthorizeAccountsPayableMutation } from '../../hooks/use-accounts-payable-mutations';
import type { AccountsPayableApi } from '../../schemas/accounts-payable-api.schema';

interface CellActionProps {
  data: AccountsPayableApi;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [openAuthorize, setOpenAuthorize] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { mutate: authorize } = useAuthorizeAccountsPayableMutation();
  const { data: detailData } = useAccountsPayableDetailQuery(
    selectedId!,
    selectedId !== null,
  );

  const isPending = data.status === 'PENDING';

  const onConfirm = async () => {
    try {
      setLoading(true);
      authorize(data.id);
      setOpenAuthorize(false);
    } catch {
      // Error handled in mutation
    } finally {
      setLoading(false);
    }
  };

  const handleView = () => {
    setSelectedId(data.id);
    setOpenView(true);
  };

  const handleAuthorize = () => {
    setOpenAuthorize(true);
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

      {detailData && openView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => {
            setOpenView(false);
            setSelectedId(null);
          }}
        >
          <div
            className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">
              Cuenta por Pagar #{detailData.invoiceNumber}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Proveedor</p>
                <p className="font-medium">{detailData.supplierName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  N° CXP
                </p>
                <p className="font-medium">{detailData.accountsPayableNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Monto Original
                </p>
                <p className="font-medium">
                  {formatCurrency(detailData.originalAmount, 'VES')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Saldo Pendiente
                </p>
                <p className="font-medium">
                  {formatCurrency(detailData.remainingAmount, 'VES')}
                </p>
              </div>
              {detailData.observations && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">
                    Observaciones
                  </p>
                  <p className="font-medium">{detailData.observations}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenView(false);
                  setSelectedId(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalles
          </DropdownMenuItem>
          {isPending && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleAuthorize}
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


