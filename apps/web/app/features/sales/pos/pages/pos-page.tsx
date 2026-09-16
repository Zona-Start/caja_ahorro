import {
  useActiveSession,
  useCashRegistersAll,
} from '@/features/expenses/hooks/use-cash-register-queries';
import { useProductDefaults } from '@/features/inventory/products/hooks/use-products-queries';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Input } from '@repo/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Separator } from '@repo/shadcn/separator';
import { Switch } from '@repo/shadcn/switch';
import { Textarea } from '@repo/shadcn/textarea';
import {
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CustomerModal } from '../../components/customer-modal';
import {
  useCustomersAll,
  usePosProducts,
} from '../../hooks/use-sales-queries';
import { useCreateSaleMutation } from '../../hooks/use-sales-mutations';
import {
  cartLineTotal,
  cartSubtotal,
  type CartLine,
  type Customer,
  type PosProduct,
} from '../../schemas/sales.schema';

const fmt = (value: number) =>
  value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PosPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [saleType, setSaleType] = useState<'CASH' | 'CREDIT'>('CASH');
  const [dueDate, setDueDate] = useState('');
  const [paymentMethod, setPaymentMethod] =
    useState<'CASH' | 'CARD' | 'TRANSFER' | 'OTHER'>('CASH');
  const [cashRegisterId, setCashRegisterId] = useState('');
  const [notes, setNotes] = useState('');
  const [createDeliveryNote, setCreateDeliveryNote] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: productsData, isLoading: loadingProducts } = usePosProducts({
    page: 1,
    limit: 30,
    search: search || undefined,
  });
  const { data: customers } = useCustomersAll();
  const { data: registersData } = useCashRegistersAll();
  const { data: defaults } = useProductDefaults();
  const { data: activeSessionData } = useActiveSession(
    cashRegisterId,
    !!cashRegisterId,
  );

  const createSale = useCreateSaleMutation();
  const taxRate = defaults?.taxSales ?? 16;
  const session = activeSessionData?.data?.session;
  const registerOptions = (registersData?.data ?? []).filter((r) => r.isActive);

  const total = useMemo(() => cartSubtotal(cart), [cart]);

  const addProduct = (product: PosProduct) => {
    const price = Number(product.finalPriceGross) || 0;
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        return prev.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: price,
          taxRate,
          unitCost: Number(product.totalCost) || 0,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((line) =>
        line.productId === productId
          ? { ...line, quantity: Math.max(1, quantity) }
          : line,
      ),
    );
  };

  const updatePrice = (productId: string, unitPrice: number) => {
    setCart((prev) =>
      prev.map((line) =>
        line.productId === productId ? { ...line, unitPrice } : line,
      ),
    );
  };

  const removeLine = (productId: string) => {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  };

  const resetForm = () => {
    setCart([]);
    setCustomerId('');
    setSaleType('CASH');
    setDueDate('');
    setPaymentMethod('CASH');
    setNotes('');
    setCreateDeliveryNote(false);
  };

  const canSubmit =
    cart.length > 0 &&
    !!customerId &&
    (saleType === 'CREDIT' ? !!dueDate : true) &&
    !createSale.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createSale.mutate(
      {
        customerId,
        saleType,
        dueDate: saleType === 'CREDIT' ? dueDate : undefined,
        notes: notes || undefined,
        paymentMethod,
        cashRegisterSessionId:
          saleType === 'CASH' && paymentMethod === 'CASH' && session?.id
            ? session.id
            : undefined,
        createDeliveryNote,
        items: cart.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          taxRate: line.taxRate,
          unitCost: line.unitCost,
        })),
      },
      { onSuccess: resetForm },
    );
  };

  const handleCustomerCreated = (customer: Customer) => {
    setCustomerId(customer.id);
  };

  return (
    <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_420px]">
      {/* ── Productos ── */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Punto de Venta</h1>
          <p className="text-muted-foreground text-sm">
            Busca un producto y agrégalo al carrito.
          </p>
        </div>

        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            className="pl-8"
            placeholder="Buscar producto por nombre..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {loadingProducts && cart.length === 0 && (
            <p className="text-muted-foreground col-span-full text-sm">
              Cargando productos...
            </p>
          )}
          {(productsData?.data ?? []).map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => addProduct(product)}
              className="hover:border-primary rounded-lg border bg-card p-3 text-left transition"
            >
              <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
              <p className="text-muted-foreground text-xs">
                {product.sku || product.categoryName || 'Sin SKU'}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-primary font-semibold">
                  Bs. {fmt(Number(product.finalPriceGross) || 0)}
                </span>
                <span className="text-muted-foreground text-xs">
                  Stock: {product.available ?? 0}
                </span>
              </div>
            </button>
          ))}
          {!loadingProducts && (productsData?.data ?? []).length === 0 && (
            <p className="text-muted-foreground col-span-full text-sm">
              No se encontraron productos.
            </p>
          )}
        </div>
      </div>

      {/* ── Carrito ── */}
      <Card className="flex h-fit flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" /> Carrito
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cliente */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cliente *</label>
            <div className="flex gap-2">
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {(customers ?? []).map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} · {customer.taxId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCustomerModalOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Líneas */}
          <div className="space-y-2">
            {cart.length === 0 && (
              <p className="text-muted-foreground py-6 text-center text-sm">
                El carrito está vacío.
              </p>
            )}
            {cart.map((line) => (
              <div key={line.productId} className="rounded-md border p-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="line-clamp-2 font-medium">{line.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => removeLine(line.productId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                      updateQuantity(line.productId, line.quantity - 1)
                    }
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Input
                    className="h-7 w-14 text-center"
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(event) =>
                      updateQuantity(line.productId, Number(event.target.value))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() =>
                      updateQuantity(line.productId, line.quantity + 1)
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Input
                    className="h-7 w-24"
                    type="number"
                    step="0.01"
                    min={0}
                    value={line.unitPrice}
                    onChange={(event) =>
                      updatePrice(line.productId, Number(event.target.value))
                    }
                  />
                  <span className="ml-auto font-mono font-semibold">
                    {fmt(cartLineTotal(line))}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Tipo de venta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={saleType}
                onValueChange={(value) => setSaleType(value as 'CASH' | 'CREDIT')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Contado</SelectItem>
                  <SelectItem value="CREDIT">Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {saleType === 'CASH' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Forma de pago</label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) =>
                    setPaymentMethod(
                      value as 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER',
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Efectivo</SelectItem>
                    <SelectItem value="CARD">Punto / Tarjeta</SelectItem>
                    <SelectItem value="TRANSFER">Transferencia</SelectItem>
                    <SelectItem value="OTHER">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Vence</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
            )}
          </div>

          {/* Caja (solo efectivo) */}
          {saleType === 'CASH' && paymentMethod === 'CASH' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Caja POS</label>
              <Select value={cashRegisterId} onValueChange={setCashRegisterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una caja" />
                </SelectTrigger>
                <SelectContent>
                  {registerOptions.map((register) => (
                    <SelectItem key={register.id} value={register.id}>
                      {register.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cashRegisterId && !session && (
                <p className="text-xs text-amber-600">
                  No hay una sesión de caja abierta. Abre una sesión para
                  registrar el efectivo.
                </p>
              )}
            </div>
          )}

          <Textarea
            placeholder="Notas (opcional)"
            className="resize-none"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />

          <div className="flex items-center gap-3">
            <Switch
              checked={createDeliveryNote}
              onCheckedChange={setCreateDeliveryNote}
            />
            <span className="text-sm text-muted-foreground">
              Generar nota de entrega
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="font-mono">Bs. {fmt(total)}</span>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {createSale.isPending
              ? 'Registrando...'
              : saleType === 'CASH'
                ? 'Cobrar'
                : 'Registrar venta a crédito'}
          </Button>
        </CardContent>
      </Card>

      <CustomerModal
        open={customerModalOpen}
        onOpenChange={setCustomerModalOpen}
        onCreated={handleCustomerCreated}
      />
    </div>
  );
}
