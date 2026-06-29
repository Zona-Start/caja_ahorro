'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { Separator } from '@repo/shadcn/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import { AlertModal } from '@/components/shared/alert-modal';
import {
  AlertCircle,
  Loader2,
  Search,
  User,
  X,
  Wallet,
  CheckCircle2,
  XCircle,
  Plus,
  Package,
  Building2,
  Info,
  Send,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { QUERY_KEYS } from '@/lib/query-keys';
import { useToastSystem } from '@/hooks/use-toast-system';
import { useBankAccountAllQuery } from '@/features/banks/bank-account/hooks/use-bank-account-query';
import {
  useAssociateWithdrawalRequestQuery,
  useWithdrawalTypesQuery,
  useSaveWithdrawalMutation,
} from '../hooks/use-withdrawal-query';
import { type WithdrawalType } from '../schemas/withdrawal-api-response';
import { type AssociatesWithdrawal } from '../schemas/individual-withdrawal-api-schema';
import { PAYMENT_METHOD } from '../schemas/withdrawal-options';
import { withdrawalSchema, type Withdrawal } from '../schemas/withdrawal.schema';
import { useSuppliersAllQuery } from '@/features/purchasing/suppliers/hooks/use-suppliers-queries';
import { useProductsQuery } from '@/features/inventory/products/hooks/use-products-queries';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WITHDRAWAL_DEFAULTS: Withdrawal = {
  associateAccountId: '',
  withdrawalTypeId: '',
  requestedAmount: 0,
  paymentMethod: 'BANK_TRANSFER',
  date: new Date(),
  description: '',
  commercialHouseId: null,
  withdrawalItems: [],
};

interface ItemLine {
  type: 'product' | 'service';
  productId?: string;
  productName?: string;
  unitCost?: number;
  totalCost?: number;
  description?: string;
  quantity: number;
  cost?: number;
  subtotal?: number;
  specialDayCategoryId?: string;
}

export function WithdrawalModal({ open, onOpenChange }: Props) {
  const toast = useToastSystem();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [items, setItems] = useState<ItemLine[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const { data: associateResp, isFetching: searching, isError: searchError } =
    useAssociateWithdrawalRequestQuery(submittedSearch, {
      enabled: shouldFetch && !!submittedSearch.trim(),
    });

  const associate = associateResp as AssociatesWithdrawal | null | undefined;

  const { data: typesResp } = useWithdrawalTypesQuery();
  const withdrawalTypes = typesResp?.data ?? [];
  const { data: suppliers } = useSuppliersAllQuery(open);
  const { data: productsData } = useProductsQuery({ page: 1, limit: 200 });
  const products = (productsData?.data as any[]) ?? [];

  const { mutate: saveWithdrawal, isPending: saving } =
    useSaveWithdrawalMutation();

  const form = useForm<Withdrawal>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: WITHDRAWAL_DEFAULTS,
  });

  const watchTypeId = useWatch({ control: form.control, name: 'withdrawalTypeId' });
  const watchAmount = useWatch({ control: form.control, name: 'requestedAmount' }) || 0;

  const selectedType = withdrawalTypes.find(
    (t) => t.id === watchTypeId,
  ) as WithdrawalType | undefined;

  const hasAutoAmount =
    selectedType?.isInternalInventory || selectedType?.isHouseComercial;

  const itemsTotal = useMemo(
    () =>
      items.reduce(
        (sum, it) =>
          sum + (it.type === 'product' ? (it.totalCost ?? 0) : (it.subtotal ?? 0)),
        0,
      ),
    [items],
  );

  const effectiveAmount = hasAutoAmount ? itemsTotal : (watchAmount || 0);

  const feePct = Number(selectedType?.administrativeFeePercentage ?? 0);
  const fee = (effectiveAmount * feePct) / 100;
  const disbursed = effectiveAmount - fee;

  const rules = useMemo(() => {
    const r: { canSave: boolean; messages: { text: string; ok: boolean }[] } = {
      canSave: true,
      messages: [],
    };
    if (!associate || !associate.associateAccountId) {
      r.canSave = false;
      r.messages.push({ text: 'Asociado no encontrado o sin cuenta', ok: false });
      return r;
    }
    if (effectiveAmount > associate.available80) {
      r.canSave = false;
      r.messages.push({
        text: `El monto supera el 80% disponible (${associate.available80.toLocaleString('es', { minimumFractionDigits: 2 })})`,
        ok: false,
      });
    }
    r.messages.push({
      text: `Disponible 80%: ${associate.available80.toLocaleString('es', { minimumFractionDigits: 2 })} Bs | Saldo: ${associate.balance.toLocaleString('es', { minimumFractionDigits: 2 })} Bs`,
      ok: true,
    });
    if (associate.hasActiveLoan) {
      r.canSave = false;
      r.messages.push({ text: 'Préstamo activo - Bloqueado', ok: false });
    }
    if (associate.hasActiveCredit) {
      r.canSave = false;
      r.messages.push({ text: 'Crédito activo - Bloqueado', ok: false });
    }
    if (associate.hasPayrollCredit) {
      r.canSave = false;
      r.messages.push({ text: 'Credinomina activo - Bloqueado', ok: false });
    }
    if (
      selectedType?.withdrawalPercentage &&
      effectiveAmount >
        (associate.balance * Number(selectedType.withdrawalPercentage)) / 100
    ) {
      r.canSave = false;
      r.messages.push({
        text: `Supera el ${selectedType.withdrawalPercentage}% permitido para este tipo`,
        ok: false,
      });
    }
    const wtMonths = associate.withdrawalTimeMonths ?? 0;
    if (wtMonths > 0 && associate.lastWithdrawalDate) {
      const monthsSince =
        (new Date().getTime() -
          new Date(associate.lastWithdrawalDate).getTime()) /
        (30 * 24 * 60 * 60 * 1000);
      if (monthsSince < wtMonths) {
        r.canSave = false;
        const remaining = Math.ceil(wtMonths - monthsSince);
        r.messages.push({
          text: `Tiempo entre retiros: faltan ${remaining} mes(es) - Bloqueado`,
          ok: false,
        });
      }
    }
    if (!selectedType) {
      r.canSave = false;
      r.messages.push({ text: 'Seleccione un tipo de retiro', ok: false });
    }
    if (selectedType?.isInternalInventory && items.length === 0) {
      r.canSave = false;
      r.messages.push({ text: 'Agregue al menos un producto', ok: false });
    }
    if (selectedType?.isHouseComercial && !supplierId) {
      r.canSave = false;
      r.messages.push({ text: 'Seleccione una casa comercial', ok: false });
    }
    if (selectedType?.isHouseComercial && supplierId && items.length === 0) {
      r.messages.push({ text: 'Agregue al menos un item', ok: false });
    }
    return r;
  }, [associate, effectiveAmount, selectedType, items, supplierId]);

  useEffect(() => {
    if (shouldFetch && !searching) {
      setShouldFetch(false);
      if (searchError) {
        toast.info({ title: 'Asociado no encontrado', description: `Cédula: ${submittedSearch}` });
        form.setValue('associateAccountId', '');
      } else if (associate?.associateAccountId) {
        form.setValue('associateAccountId', associate.associateAccountId);
      }
    }
  }, [searching, shouldFetch, searchError, associate, submittedSearch, form, toast]);

  useEffect(() => {
    if (hasAutoAmount) form.setValue('requestedAmount', effectiveAmount);
  }, [effectiveAmount, hasAutoAmount, form]);

  const handleSearch = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      toast.warning({ title: 'Campo vacío', description: 'Ingrese una cédula.' });
      return;
    }
    queryClient.removeQueries({ queryKey: [...QUERY_KEYS.withdrawals.all, 'request'] });
    setItems([]);
    setSupplierId('');
    form.reset(WITHDRAWAL_DEFAULTS);
    setSubmittedSearch(trimmed);
    setShouldFetch(true);
  }, [searchQuery, queryClient, form, toast]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setSubmittedSearch('');
    setItems([]);
    setSupplierId('');
    setShowProductSearch(false);
    setProductSearchQuery('');
    form.reset(WITHDRAWAL_DEFAULTS);
    queryClient.removeQueries({ queryKey: [...QUERY_KEYS.withdrawals.all, 'request'] });
  }, [queryClient, form]);

  const addProductItem = useCallback(
    (productId: string) => {
      const p = products.find((p: any) => p.id === productId);
      if (!p) return;
      const unitCost = p.activeSalePrice ?? p.costWithTax ?? p.unitCost ?? 0;
      setItems((prev) => [
        ...prev,
        {
          type: 'product',
          productId,
          productName: p.name,
          unitCost,
          quantity: 1,
          totalCost: unitCost,
        },
      ]);
    },
    [products],
  );

  const addServiceItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { type: 'service', description: '', quantity: 1, cost: 0, subtotal: 0 },
    ]);
  }, []);

  const updateItem = useCallback(
    (index: number, field: string, value: any) => {
      setItems((prev) => {
        const updated = [...prev];
        const item = { ...updated[index] } as any;
        item[field] = value;
        if (item.type === 'product' && (field === 'quantity' || field === 'unitCost'))
          item.totalCost = (item.quantity || 0) * (item.unitCost || 0);
        if (item.type === 'service' && (field === 'quantity' || field === 'cost'))
          item.subtotal = (item.quantity || 0) * (item.cost || 0);
        updated[index] = item;
        return updated;
      });
    },
    [],
  );

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = form.handleSubmit((data) => {
    if (!associate?.associateAccountId || !selectedType) return;

    let withdrawalItems: any[] = [];
    if (selectedType.isInternalInventory) {
      withdrawalItems = items
        .filter((i) => i.type === 'product')
        .map((i) => ({
          itemType: 'PRODUCT',
          itemId: i.productId,
          itemDescription: i.productName ?? null,
          quantity: i.quantity,
          agreedSellingPrice: i.unitCost,
          days: null,
        }));
    } else if (selectedType.isHouseComercial) {
      withdrawalItems = items
        .filter((i) => i.type === 'service')
        .map((i) => ({
          itemType: 'EXTERNAL',
          itemId: null,
          itemDescription: i.description,
          quantity: i.quantity,
          agreedSellingPrice: i.cost,
          days: i.specialDayCategoryId || null,
        }));
    }

    const payload: Withdrawal = {
      ...data,
      associateAccountId: associate.associateAccountId,
      withdrawalTypeId: selectedType.id,
      requestedAmount: effectiveAmount,
      paymentMethod: hasAutoAmount ? 'BANK_TRANSFER' : data.paymentMethod,
      commercialHouseId: supplierId || null,
      withdrawalItems: withdrawalItems.length > 0 ? withdrawalItems : undefined,
    };

    saveWithdrawal(payload, {
      onSuccess: () => {
        toast.success({ title: 'Solicitud de retiro', description: 'Creada exitosamente para ' + associate.fullname });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withdrawals.lists() });
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          handleClear();
          onOpenChange(false);
        }, 1500);
      },
      onError: (err: unknown) => {
        toast.error({ title: 'Error', description: (err as any)?.response?.data?.message ?? (err as Error)?.message ?? 'No se pudo crear el retiro' });
      },
    });
    setConfirmOpen(false);
  });

  const hasAssociate = !!associate?.associateAccountId;
  const isFormDisabled = !hasAssociate || saving || !rules.canSave;

  const handleClose = () => {
    handleClear();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Nueva Solicitud de Retiro
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
            <p className="text-lg font-bold text-green-800">Solicitud Creada</p>
            <p className="text-sm text-green-700">El retiro fue registrado correctamente.</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* SEARCH SECTION */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Ingrese Cédula del Asociado..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={searching}
                />
              </div>
              <Button onClick={handleSearch} disabled={!searchQuery.trim() || searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2">Buscar</span>
              </Button>
            </div>

            {searching && !associate && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground mt-2">Validando asociado...</p>
              </div>
            )}

            {/* ASSOCIATE DATA */}
            {!searching && associate?.associateAccountId && (
              <div className="rounded-lg border p-4 bg-muted/30 relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4" />
                </Button>
                <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
                  Datos del Asociado
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nombre y Apellido:</span>
                    <span className="text-sm font-bold">{associate.fullname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cédula:</span>
                    <span className="text-sm font-mono">{associate.cedula}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nro. Cuenta:</span>
                    <span className="text-sm font-mono font-semibold">{associate.accountNumber}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-muted-foreground">Saldo Total:</span>
                    <span className="text-lg font-black text-primary">
                      {formatCurrency(associate.balance || 0, 'VES')}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-sm text-muted-foreground">80% Disponible:</span>
                    <span className="text-lg font-black text-[#305AD9]">
                      {formatCurrency(associate.available80 || 0, 'VES')}
                    </span>
                  </div>
                  {/* BLOCK BADGES */}
                  {(associate.hasActiveLoan ||
                    associate.hasActiveCredit ||
                    associate.hasPayrollCredit) && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {associate.hasActiveLoan && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive px-2.5 py-0.5 text-xs font-medium">
                          <XCircle className="h-3 w-3" /> Préstamo Activo
                        </span>
                      )}
                      {associate.hasActiveCredit && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive px-2.5 py-0.5 text-xs font-medium">
                          <XCircle className="h-3 w-3" /> Crédito Activo
                        </span>
                      )}
                      {associate.hasPayrollCredit && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive px-2.5 py-0.5 text-xs font-medium">
                          <XCircle className="h-3 w-3" /> Credinomina Activo
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!searching && !associate && !searchError && (
              <div className="text-center py-6 border border-dashed rounded-lg">
                <User className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p className="text-muted-foreground mt-2 text-sm">Ningún asociado seleccionado</p>
              </div>
            )}

            {/* WITHDRAWAL FORM */}
            {hasAssociate && (
              <Form {...form}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setConfirmOpen(true);
                  }}
                  className="space-y-4 border-t pt-4"
                >
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Send className="h-5 w-5" /> Detalles del Retiro
                  </div>

                  <FormField
                    control={form.control}
                    name="withdrawalTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Retiro *</FormLabel>
                        <Select
                          onValueChange={(v) => {
                            field.onChange(v);
                            setItems([]);
                            setSupplierId('');
                          }}
                          value={field.value || undefined}
                          disabled={saving}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione tipo de retiro" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {withdrawalTypes.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* TYPE INFO */}
                  {selectedType && (
                    <div className="rounded-lg border border-[#3098F2]/30 bg-[#3098F2]/5 p-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-[#3098F2]" />
                        <span className="text-sm font-semibold uppercase text-muted-foreground">
                          Información del Tipo
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">% Máximo:</span>{' '}
                          <span className="font-medium">{selectedType.withdrawalPercentage ?? 100}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">% Gasto Admin:</span>{' '}
                          <span className="font-medium">{selectedType.administrativeFeePercentage ?? 0}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Inventario:</span>{' '}
                          <span className={`font-medium ${selectedType.isInternalInventory ? 'text-[#2EA640]' : 'text-muted-foreground'}`}>
                            {selectedType.isInternalInventory ? 'Sí' : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Casa Comercial:</span>{' '}
                          <span className={`font-medium ${selectedType.isHouseComercial ? 'text-[#2EA640]' : 'text-muted-foreground'}`}>
                            {selectedType.isHouseComercial ? 'Sí' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* INVENTORY PRODUCTS */}
                  {selectedType?.isInternalInventory && (
                    <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span className="text-sm font-semibold uppercase text-muted-foreground">
                            Productos de Inventario
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowProductSearch(true);
                            setProductSearchQuery('');
                          }}
                          className="gap-1"
                        >
                          <Plus className="h-3 w-3" /> Agregar
                        </Button>
                      </div>

                      {showProductSearch && (
                        <div className="rounded-lg border p-3 space-y-2 bg-background">
                          <Input
                            placeholder="Buscar producto..."
                            value={productSearchQuery}
                            onChange={(e) => setProductSearchQuery(e.target.value)}
                            autoFocus
                            className="h-8 text-xs"
                          />
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {products
                              .filter((p: any) => {
                                if (!productSearchQuery) return true;
                                const q = productSearchQuery.toLowerCase();
                                return (p.name ?? '').toLowerCase().includes(q);
                              })
                              .slice(0, 20)
                              .map((p: any) => (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    addProductItem(p.id);
                                    setShowProductSearch(false);
                                  }}
                                  className="flex items-center justify-between px-3 py-2 rounded-md cursor-pointer hover:bg-muted text-xs"
                                >
                                  <span className="font-medium">{p.name}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {items
                        .filter((i) => i.type === 'product')
                        .map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-end border rounded-md p-2">
                            <div className="flex-1">
                              <span className="text-xs text-muted-foreground">{item.productName}</span>
                            </div>
                            <div className="w-20">
                              <span className="text-xs text-muted-foreground">Cant</span>
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="w-24">
                              <span className="text-xs text-muted-foreground">Precio U.</span>
                              <Input
                                type="text"
                                value={item.unitCost?.toFixed(2)}
                                onChange={(e) =>
                                  updateItem(idx, 'unitCost', Number(e.target.value.replace(/[^0-9.]/g, '')))
                                }
                                className="h-8 text-xs font-mono"
                              />
                            </div>
                            <div className="w-24 text-right">
                              <span className="text-xs text-muted-foreground">Subtotal</span>
                              <div className="h-8 flex items-center justify-end text-xs font-mono">
                                {item.totalCost?.toLocaleString('es', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-destructive hover:text-destructive/80 p-1"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* COMMERCIAL HOUSE */}
                  {selectedType?.isHouseComercial && (
                    <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm font-semibold uppercase text-muted-foreground">
                          Casa Comercial
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Proveedor *</span>
                        <select
                          value={supplierId}
                          onChange={(e) => setSupplierId(e.target.value)}
                          className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#3098F2] mt-1"
                        >
                          <option value="">Seleccionar proveedor...</option>
                          {(Array.isArray(suppliers) ? suppliers : []).map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {supplierId && (
                        <div className="space-y-2">
                          <div className="flex justify-end">
                            <Button type="button" size="sm" variant="outline" onClick={addServiceItem} className="gap-1">
                              <Plus className="h-3 w-3" /> Agregar Item
                            </Button>
                          </div>
                          {items
                            .filter((i) => i.type === 'service')
                            .map((item, idx) => (
                              <div key={idx} className="flex gap-2 items-end border rounded-md p-2 flex-wrap">
                                <div className="flex-1">
                                  <span className="text-xs text-muted-foreground">Descripción</span>
                                  <Input
                                    value={item.description}
                                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                    className="h-8 text-xs"
                                    placeholder="Ej: Instalación"
                                  />
                                </div>
                                <div className="w-16">
                                  <span className="text-xs text-muted-foreground">Cant</span>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div className="w-24">
                                  <span className="text-xs text-muted-foreground">Costo</span>
                                  <Input
                                    type="text"
                                    value={item.cost && item.cost > 0 ? String(item.cost) : ''}
                                    onChange={(e) => {
                                      const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                                      const num = cleaned ? parseFloat(cleaned) : 0;
                                      updateItem(idx, 'cost', num);
                                    }}
                                    className="h-8 text-xs font-mono"
                                    placeholder="0,00"
                                  />
                                </div>
                                <div className="w-24 text-right">
                                  <span className="text-xs text-muted-foreground">Subtotal</span>
                                  <div className="h-8 flex items-center justify-end text-xs font-mono">
                                    {item.subtotal?.toLocaleString('es', { minimumFractionDigits: 2 })}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeItem(idx)}
                                  className="text-destructive hover:text-destructive/80 p-1 mt-5"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* PARAMETERS */}
                  <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span className="text-sm font-semibold uppercase text-muted-foreground">
                        Parámetros
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground">Monto *</span>
                        {hasAutoAmount ? (
                          <div className="h-9 flex items-center px-3 rounded-md border bg-background text-sm font-mono mt-1">
                            {effectiveAmount.toLocaleString('es', { minimumFractionDigits: 2 })} Bs
                          </div>
                        ) : (
                          <div className="relative mt-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                              Bs.
                            </span>
                            <Input
                              className="pl-10 text-lg font-bold h-11"
                              type="number"
                              value={watchAmount || ''}
                              onChange={(e) =>
                                form.setValue('requestedAmount', Number(e.target.value) || 0)
                              }
                              disabled={saving}
                            />
                          </div>
                        )}
                      </div>
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha *</FormLabel>
                            <FormControl>
                              <CustomCalendar
                                value={field.value}
                                onChange={field.onChange}
                                disabled={saving}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {!hasAutoAmount && (
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Método de Pago *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={saving}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Método" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(PAYMENT_METHOD).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>
                                    {v}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {effectiveAmount > 0 && selectedType && (
                      <div className="text-sm text-muted-foreground">
                        <span>Comisión Admin ({feePct}%): </span>
                        <span className="font-mono">
                          {fee.toLocaleString('es', { minimumFractionDigits: 2 })} Bs |{' '}
                        </span>
                        <span>Desembolsar: </span>
                        <span className="font-mono font-semibold text-[#2EA640]">
                          {disbursed.toLocaleString('es', { minimumFractionDigits: 2 })} Bs
                        </span>
                      </div>
                    )}
                  </div>

                  {/* RULES PANEL */}
                  <div
                    className={`rounded-lg border p-3 ${
                      rules.canSave
                        ? 'border-[#2EA640]/30 bg-[#2EA640]/5'
                        : 'border-destructive/30 bg-destructive/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {rules.canSave ? (
                        <CheckCircle2 className="h-4 w-4 text-[#2EA640]" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="text-sm font-semibold uppercase text-muted-foreground">
                        {rules.canSave ? 'Reglas Cumplidas' : 'Reglas Bloqueantes'}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {rules.messages.map((msg, i) => (
                        <li
                          key={i}
                          className={`text-xs flex items-center gap-1.5 ${msg.ok ? 'text-[#2EA640]' : 'text-destructive'}`}
                        >
                          {msg.ok ? (
                            <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 flex-shrink-0" />
                          )}
                          {msg.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* FOOTER */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Total</span>
                      <p className="text-xl font-black text-primary">
                        {formatCurrency(effectiveAmount, 'VES')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                        Cancelar
                      </Button>
                      <Button type="submit" size="sm" disabled={isFormDisabled}>
                        {saving ? (
                          <>
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Procesando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-1 h-4 w-4" /> Solicitar Retiro
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            )}
          </div>
        )}

        <AlertModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleSubmit}
          loading={saving}
          title="Confirmar Retiro"
          description="¿Está seguro que desea registrar este retiro de haberes?"
        />
      </DialogContent>
    </Dialog>
  );
}
