import { Button } from '@repo/shadcn/button';
import { FileText, FileWarning } from 'lucide-react';
import { useSupplierInvoicesModalStore } from '../store/supplier-invoices-modal.store';

interface Props {
  onCreditDebitClick?: () => void;
}

export function SupplierInvoicesHeader({ onCreditDebitClick }: Props) {
  const { openModal } = useSupplierInvoicesModalStore();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Facturas de Proveedores</h2>
        <p className="text-sm text-muted-foreground">
          Gestiona las facturas recibidas de proveedores
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={() => openModal('create')}>
          <FileText className="mr-2 h-4 w-4" />
          Nueva Factura
        </Button>
        <Button variant="outline" onClick={onCreditDebitClick}>
          <FileWarning className="mr-2 h-4 w-4" />
          Nueva N/C o N/D
        </Button>
      </div>
    </div>
  );
}
