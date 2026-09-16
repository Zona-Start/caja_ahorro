import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Input } from '@repo/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { useMemo, useState } from 'react';
import { useProductsQuery } from '../../products/hooks/use-products-queries';
import { useCreateMovementMutation } from '../hooks/use-movements-queries';
import { toQuickPurchasePayload } from '../schemas/quick-purchase.schema';

interface QuickPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickPurchaseModal({
  open,
  onOpenChange,
}: QuickPurchaseModalProps) {
  const { data: productsData } = useProductsQuery({ page: 1, limit: 100 });
  const createMovement = useCreateMovementMutation();

  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('0');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [description, setDescription] = useState('');

  const products = useMemo(
    () =>
      (productsData?.data ?? []).map((product) => ({
        id: product.id ?? '',
        name: product.name,
      })),
    [productsData],
  );

  const canSubmit =
    !!productId && Number(quantity) > 0 && !createMovement.isPending;

  const reset = () => {
    setProductId('');
    setQuantity('1');
    setUnitCost('0');
    setInvoiceNumber('');
    setDescription('');
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload = toQuickPurchasePayload({
      productId,
      quantity: Number(quantity),
      unitCost: Number(unitCost) || 0,
      invoiceNumber: invoiceNumber || undefined,
      description: description || undefined,
    });
    createMovement.mutate(payload, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) reset();
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Compra Rápida</DialogTitle>
          <DialogDescription>
            Da entrada a stock de un producto sin orden de compra.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Producto *</label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad *</label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Costo unitario</label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={unitCost}
                onChange={(event) => setUnitCost(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              N° de factura (opcional)
            </label>
            <Input
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
              placeholder="Ej: 000123"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Nota (opcional)</label>
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Detalle de la compra"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button disabled={!canSubmit} onClick={handleSubmit}>
              {createMovement.isPending ? 'Registrando...' : 'Registrar entrada'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
