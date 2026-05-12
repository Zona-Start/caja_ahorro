import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@repo/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Eye, MoreHorizontal } from 'lucide-react';
import { useMovementQuery } from '../../hooks/use-movements-queries';
import {
  MOVEMENT_TYPE_OPTIONS,
  DOCUMENT_TYPE_OPTIONS,
  ITEM_TYPE_OPTIONS,
} from '../../schemas/movements-options';
import type { InventoryMovement } from '../../schemas/movements.schema';

interface CellActionProps {
  data: InventoryMovement;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [openView, setOpenView] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: movementData } = useMovementQuery(
    selectedId!,
    selectedId !== null,
  );

  const handleView = () => {
    setSelectedId(data.id);
    setOpenView(true);
  };

  return (
    <>
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
        </DropdownMenuContent>
      </DropdownMenu>

      {movementData && openView && (
        <MovementDetailDialog
          open={openView}
          onOpenChange={(open) => {
            setOpenView(open);
            if (!open) setSelectedId(null);
          }}
          movement={movementData}
        />
      )}
    </>
  );
};

interface MovementDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: InventoryMovement;
}

function MovementDetailDialog({
  open,
  onOpenChange,
  movement,
}: MovementDetailDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Detalle del Movimiento</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Tipo de Movimiento</p>
            <p className="font-medium">
              {MOVEMENT_TYPE_OPTIONS[
                movement.movementType as keyof typeof MOVEMENT_TYPE_OPTIONS
              ] || movement.movementType}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tipo de Documento</p>
            <p className="font-medium">
              {DOCUMENT_TYPE_OPTIONS[
                movement.documentType as keyof typeof DOCUMENT_TYPE_OPTIONS
              ] || movement.documentType}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nro. Documento</p>
            <p className="font-medium">{movement.documentNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Descripción</p>
            <p className="font-medium">{movement.description}</p>
          </div>
          {movement.notes && (
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Notas</p>
              <p className="font-medium">{movement.notes}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Creado</p>
            <p className="font-medium">
              {movement.createdAt
                ? format(new Date(movement.createdAt), 'dd/MM/yyyy HH:mm')
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Actualizado</p>
            <p className="font-medium">
              {movement.updatedAt
                ? format(new Date(movement.updatedAt), 'dd/MM/yyyy HH:mm')
                : '-'}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-md font-semibold mb-2">Ítems</h3>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Ítem</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-right">Cantidad</th>
                  <th className="px-3 py-2 text-right">Precio Unit.</th>
                  <th className="px-3 py-2 text-left">Unidad</th>
                </tr>
              </thead>
              <tbody>
                {movement.items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-3 py-2">{item.itemName}</td>
                    <td className="px-3 py-2">
                      {ITEM_TYPE_OPTIONS[
                        item.itemType as keyof typeof ITEM_TYPE_OPTIONS
                      ] || item.itemType}
                    </td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">
                      {item.unitPrice != null ? item.unitPrice : '-'}
                    </td>
                    <td className="px-3 py-2">{item.unit ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
