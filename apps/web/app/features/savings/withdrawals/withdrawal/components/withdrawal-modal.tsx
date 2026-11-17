'use client';

import { AlertModal } from '@/components/shared/alert-modal';
import { useBankAccountsQuery } from '@/features/banks/bank-account/hooks/use-bank-account-query';
import { exchangeRatesService } from '@/features/core/exchange-rates/services/exchange-rates-service';
import { useProductsQuery } from '@/features/inventory/products/hooks/use-products-queries';
import { type Product } from '@/features/inventory/products/schemas/products.schema';
import { ProductsService } from '@/features/inventory/products/services/products-service';
import { useSuppliersAllQuery } from '@/features/purchasing/suppliers/hooks/use-suppliers-queries';
import { CATEGORY_OPTIONS } from '@/features/purchasing/suppliers/schemas/suppliers-options';
import { useToastSystem } from '@/hooks/use-toast-system';
import { formatCurrency } from '@/lib/format-utils';
import { QUERY_KEYS } from '@/lib/query-keys';
import { useAuthStore } from '@/stores/auth.store';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
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
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Info,
  Loader2,
  Package,
  Plus,
  Search,
  Send,
  ShieldAlert,
  User,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  useAssociateWithdrawalRequestQuery,
  useSaveWithdrawalMutation,
  useWithdrawalTypesQuery,
} from '../hooks/use-withdrawal-query';
import { type AssociatesWithdrawal } from '../schemas/individual-withdrawal-api-schema';
import { type WithdrawalType } from '../schemas/withdrawal-api-response';
import { PAYMENT_METHOD } from '../schemas/withdrawal-options';
import { isExcludedWithdrawalType } from '../services/withdrawal-service';
import {
  withdrawalSchema,
  type Withdrawal,
} from '../schemas/withdrawal.schema';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const round2 = (value: number) => Number(value.toFixed(2));

const normalizeText = (value: string | null | undefined) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const isPartialWithdrawalType = (description?: string | null) => {
  const normalized = normalizeText(description);
  return (
    normalized.includes('retiros parciales') ||
    (normalized.includes('parcial') && normalized.includes('rcv'))
  );
};

const WITHDRAWAL_DEFAULTS: Withdrawal = {
  associateAccountId: '',
  withdrawalTypeId: '',
  requestedAmount: 0,
  paymentMethod: 'BANK_TRANSFER',
  date: new Date(),
  description: '',
  commercialHouseId: null,
  currencyCode: 'VES',
  exchangeRate: 1,
  goodsTotalAmount: 0,
  receivedAmount: 0,
  receivedCurrencyCode: 'VES',
  receivedExchangeRate: 1,
  receivedPaymentMethod: 'BANK_TRANSFER',
  receivedReference: '',
  receivedBankAccountId: '',
  receivedAt: new Date(),
  allowWithActiveLoanOrCredit: false,
  allowWithPayrollCredit: false,
  allowEarlyWithdrawal: false,
  allowExceedAvailableBalance: false,
  withdrawalItems: [],
};

interface ItemLine {
  type: 'product' | 'service' | 'manual';
  productId?: string;
  productName?: string;
  unitCost?: number;
  totalCost?: number;
  description?: string;
  quantity: number;
  cost?: number;
  subtotal?: number;
  specialDayCategoryId?: string;
  // Precio original en la moneda de la sesión y tasa aplicada.
  unitPrice?: number;
  currencyCode?: string;
  exchangeRate?: number;
}

export function WithdrawalModal({ open, onOpenChange }: Props) {
  const toast = useToastSystem();
  const queryClient = useQueryClient();
  const canUseSpecialParams = useAuthStore((s) =>
    s.hasPermission('savings:withdrawals', 'special_params'),
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [items, setItems] = useState<ItemLine[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [enablePartialPayment, setEnablePartialPayment] = useState(false);

  const {
    data: associateResp,
    isFetching: searching,
    isError: searchError,
  } = useAssociateWithdrawalRequestQuery(submittedSearch, {
    enabled: shouldFetch && !!submittedSearch.trim(),
  });

  const associate = associateResp as AssociatesWithdrawal | null | undefined;

  const { data: typesResp } = useWithdrawalTypesQuery();
  const withdrawalTypes = (typesResp?.data ?? []).filter(
    (type) => !isExcludedWithdrawalType(type.description),
  );
  const { data: suppliers } = useSuppliersAllQuery(open);
  const { data: productsData } = useProductsQuery({ page: 1, limit: 200 });
  const products: Product[] =
    (productsData?.data as Product[] | undefined) ?? [];
  const { data: bankAccountsResponse } = useBankAccountsQuery({
    page: 1,
    limit: 500,
  });
  const bankAccounts = bankAccountsResponse?.data ?? [];

  const servicesCategory = CATEGORY_OPTIONS.find(
    (c) => c.label === 'Servicios',
  )?.value;
  const serviceSuppliers = useMemo(
    () =>
      (suppliers ?? []).filter(
        (s) => !!servicesCategory && s.category === servicesCategory,
      ),
    [suppliers, servicesCategory],
  );

  const { mutate: saveWithdrawal, isPending: saving } =
    useSaveWithdrawalMutation();

  const form = useForm<Withdrawal>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: WITHDRAWAL_DEFAULTS,
  });

  const watchTypeId = useWatch({
    control: form.control,
    name: 'withdrawalTypeId',
  });
  const watchAmount =
    useWatch({ control: form.control, name: 'requestedAmount' }) || 0;
  const watchCurrency =
    useWatch({ control: form.control, name: 'currencyCode' }) || 'VES';
  const watchExchangeRate =
    useWatch({ control: form.control, name: 'exchangeRate' }) || 0;
  const watchReceivedAmount =
    useWatch({ control: form.control, name: 'receivedAmount' }) || 0;
  const watchReceivedBankAccountId =
    useWatch({ control: form.control, name: 'receivedBankAccountId' }) || '';
  const watchReceivedPaymentMethod =
    useWatch({ control: form.control, name: 'receivedPaymentMethod' }) ||
    'BANK_TRANSFER';
  const watchReceivedReference =
    useWatch({ control: form.control, name: 'receivedReference' }) || '';
  const watchReceivedAt = useWatch({
    control: form.control,
    name: 'receivedAt',
  });
  const receivedBankAccounts = useMemo(
    () =>
      (bankAccounts as any[]).filter(
        (account) =>
          account.isActive !== false &&
          (account.currencyCode === watchCurrency ||
            account.currencyCode === 'VES'),
      ),
    [bankAccounts, watchCurrency],
  );
  const allowWithActiveLoanOrCredit =
    useWatch({ control: form.control, name: 'allowWithActiveLoanOrCredit' }) ??
    false;
  const allowWithPayrollCredit =
    useWatch({ control: form.control, name: 'allowWithPayrollCredit' }) ??
    false;
  const allowEarlyWithdrawal =
    useWatch({ control: form.control, name: 'allowEarlyWithdrawal' }) ?? false;
  const allowExceedAvailableBalance =
    useWatch({ control: form.control, name: 'allowExceedAvailableBalance' }) ??
    false;

  const selectedType = withdrawalTypes.find((t) => t.id === watchTypeId) as
    WithdrawalType | undefined;

  const isPartialWithdrawal = isPartialWithdrawalType(
    selectedType?.description,
  );
  const isGoodsWithdrawal = !!selectedType && !isPartialWithdrawal;
  const isManualGoods =
    isGoodsWithdrawal &&
    !selectedType?.isInternalInventory &&
    !selectedType?.isHouseComercial;
  const hasAutoAmount = isGoodsWithdrawal;

  const itemsTotal = useMemo(
    () =>
      items.reduce(
        (sum, it) =>
          sum +
          (it.type === 'product' ? (it.totalCost ?? 0) : (it.subtotal ?? 0)),
        0,
      ),
    [items],
  );

  const sessionRate =
    watchCurrency !== 'VES' ? watchExchangeRate || 0 : 1;
  const receivedBase = round2(
    (Number(watchReceivedAmount) || 0) * sessionRate,
  );
  const effectiveAmount = isGoodsWithdrawal
    ? Math.max(0, round2(itemsTotal - receivedBase))
    : watchAmount || 0;

  const feePct = Number(selectedType?.administrativeFeePercentage ?? 0);
  const fee = (effectiveAmount * feePct) / 100;
  const disbursed = isGoodsWithdrawal
    ? effectiveAmount + fee
    : effectiveAmount - fee;

  const rules = useMemo(() => {
    const r: { canSave: boolean; messages: { text: string; ok: boolean }[] } = {
      canSave: true,
      messages: [],
    };
    if (!associate || !associate.associateAccountId) {
      r.canSave = false;
      r.messages.push({
        text: 'Asociado no encontrado o sin cuenta',
        ok: false,
      });
      return r;
    }
    if (round2(effectiveAmount) > round2(associate.available80)) {
      if (allowExceedAvailableBalance) {
        r.messages.push({
          text: `Supera el 80% disponible - Permitido por parámetro especial`,
          ok: true,
        });
      } else {
        r.canSave = false;
        r.messages.push({
          text: `El monto supera el 80% disponible (${associate.available80.toLocaleString('es', { minimumFractionDigits: 2 })})`,
          ok: false,
        });
      }
    }
    r.messages.push({
      text: `Disponible 80%: ${associate.available80.toLocaleString('es', { minimumFractionDigits: 2 })} Bs | Saldo: ${associate.balance.toLocaleString('es', { minimumFractionDigits: 2 })} Bs`,
      ok: true,
    });
    if (associate.hasActiveLoan) {
      if (allowWithActiveLoanOrCredit) {
        r.messages.push({
          text: 'Préstamo activo - Permitido por parámetro especial',
          ok: true,
        });
      } else {
        r.canSave = false;
        r.messages.push({ text: 'Préstamo activo - Bloqueado', ok: false });
      }
    }
    if (associate.hasActiveCredit) {
      if (allowWithActiveLoanOrCredit) {
        r.messages.push({
          text: 'Crédito activo - Permitido por parámetro especial',
          ok: true,
        });
      } else {
        r.canSave = false;
        r.messages.push({ text: 'Crédito activo - Bloqueado', ok: false });
      }
    }
    if (associate.hasPayrollCredit) {
      if (allowWithPayrollCredit) {
        r.messages.push({
          text: 'Credinomina activo - Permitido por parámetro especial',
          ok: true,
        });
      } else {
        r.canSave = false;
        r.messages.push({ text: 'Credinomina activo - Bloqueado', ok: false });
      }
    }
    if (
      selectedType?.withdrawalPercentage &&
      round2(effectiveAmount) >
        round2(
          (associate.balance * Number(selectedType.withdrawalPercentage)) / 100,
        )
    ) {
      if (allowExceedAvailableBalance) {
        r.messages.push({
          text: `Supera el ${selectedType.withdrawalPercentage}% permitido para este tipo - Permitido por parámetro especial`,
          ok: true,
        });
      } else {
        r.canSave = false;
        r.messages.push({
          text: `Supera el ${selectedType.withdrawalPercentage}% permitido para este tipo`,
          ok: false,
        });
      }
    }
    const wtMonths = associate.withdrawalTimeMonths ?? 0;
    if (wtMonths > 0 && associate.lastWithdrawalDate) {
      const monthsSince =
        (new Date().getTime() -
          new Date(associate.lastWithdrawalDate).getTime()) /
        (30 * 24 * 60 * 60 * 1000);
      if (monthsSince < wtMonths) {
        const remaining = Math.ceil(wtMonths - monthsSince);
        if (allowEarlyWithdrawal) {
          r.messages.push({
            text: `Tiempo entre retiros: faltan ${remaining} mes(es) - Permitido por parámetro especial`,
            ok: true,
          });
        } else {
          r.canSave = false;
          r.messages.push({
            text: `Tiempo entre retiros: faltan ${remaining} mes(es) - Bloqueado`,
            ok: false,
          });
        }
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
    if (
      selectedType?.isHouseComercial &&
      supplierId &&
      items.length === 0
    ) {
      r.canSave = false;
      r.messages.push({ text: 'Agregue al menos un item', ok: false });
    }

    if (isGoodsWithdrawal && items.length === 0) {
      r.canSave = false;
      r.messages.push({
        text: 'Agregue al menos un producto o servicio',
        ok: false,
      });
    }

    if (
      isGoodsWithdrawal &&
      watchCurrency !== 'VES' &&
      !(watchExchangeRate > 0)
    ) {
      r.canSave = false;
      r.messages.push({
        text: 'Indique la tasa de cambio de la moneda del retiro',
        ok: false,
      });
    }

    if (isGoodsWithdrawal && watchReceivedAmount > 0) {
      if (!watchReceivedBankAccountId) {
        r.canSave = false;
        r.messages.push({
          text: 'Seleccione la cuenta bancaria donde se recibió el pago',
          ok: false,
        });
      }
      if (!watchReceivedPaymentMethod) {
        r.canSave = false;
        r.messages.push({
          text: 'Seleccione el método del pago recibido',
          ok: false,
        });
      }
      if (!watchReceivedReference.trim()) {
        r.canSave = false;
        r.messages.push({
          text: 'Indique la referencia del pago recibido',
          ok: false,
        });
      }
      if (receivedBase >= itemsTotal) {
        r.canSave = false;
        r.messages.push({
          text: 'El pago recibido debe ser menor al total de los productos',
          ok: false,
        });
      }
      const selectedAccount = (bankAccounts as any[]).find(
        (account) => account.id === watchReceivedBankAccountId,
      );
      if (
        selectedAccount &&
        selectedAccount.currencyCode !== watchCurrency &&
        selectedAccount.currencyCode !== 'VES'
      ) {
        r.canSave = false;
        r.messages.push({
          text: 'La cuenta bancaria debe estar en la moneda del retiro o en bolívares',
          ok: false,
        });
      }
    } else if (
      isGoodsWithdrawal &&
      (watchReceivedBankAccountId || watchReceivedReference.trim())
    ) {
      r.canSave = false;
      r.messages.push({
        text: 'Indique el monto del pago parcial recibido',
        ok: false,
      });
    }

    if (isGoodsWithdrawal && effectiveAmount <= 0) {
      r.canSave = false;
      r.messages.push({
        text: 'El monto financiado por haberes debe ser mayor a cero',
        ok: false,
      });
    }

    return r;
  }, [
    associate,
    effectiveAmount,
    selectedType,
    items,
    itemsTotal,
    supplierId,
    allowWithActiveLoanOrCredit,
    allowWithPayrollCredit,
    allowEarlyWithdrawal,
    allowExceedAvailableBalance,
    isGoodsWithdrawal,
    watchCurrency,
    watchExchangeRate,
    watchReceivedAmount,
    watchReceivedBankAccountId,
    watchReceivedPaymentMethod,
    watchReceivedReference,
    receivedBase,
    bankAccounts,
  ]);

  const timeRuleBlocked = useMemo(() => {
    const wtMonths = associate?.withdrawalTimeMonths ?? 0;
    if (wtMonths <= 0 || !associate?.lastWithdrawalDate) return false;
    const monthsSince =
      (new Date().getTime() -
        new Date(associate.lastWithdrawalDate).getTime()) /
      (30 * 24 * 60 * 60 * 1000);
    return monthsSince < wtMonths;
  }, [associate]);

  // El área de parámetros especiales se muestra siempre que el usuario tenga
  // el permiso específico y haya un asociado seleccionado.
  const showSpecialParams =
    canUseSpecialParams && !!associate?.associateAccountId;

  // Tasa de cambio de la sesión: se carga la del día y queda editable.
  useEffect(() => {
    if (watchCurrency === 'VES') {
      form.setValue('exchangeRate', 1);
      return;
    }

    form.setValue('exchangeRate', 0);
    let cancelled = false;
    exchangeRatesService
      .getLatest(watchCurrency)
      .then((res) => {
        if (cancelled) return;
        const rate = Number(res?.rate);
        if (Number.isFinite(rate) && rate > 0) {
          form.setValue('exchangeRate', rate);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [watchCurrency, form]);

  // Revaloriza los productos/servicios cuando cambia la moneda o la tasa.
  useEffect(() => {
    if (items.length === 0) return;

    const sessionCurrencyRate =
      watchCurrency !== 'VES' ? watchExchangeRate || 0 : 1;

    setItems((prev) =>
      prev.map((item) => {
        const itemCurrency = item.currencyCode ?? watchCurrency;
        let itemRate = 1;

        if (itemCurrency !== 'VES') {
          itemRate =
            itemCurrency === watchCurrency && sessionCurrencyRate > 0
              ? sessionCurrencyRate
              : item.exchangeRate || 1;
        }

        const unitBase = round2(
          Number(item.unitPrice ?? item.cost ?? 0) * itemRate,
        );

        if (item.type === 'product') {
          return {
            ...item,
            exchangeRate: itemRate,
            unitCost: unitBase,
            totalCost: round2(unitBase * (Number(item.quantity) || 0)),
          };
        }

        return {
          ...item,
          exchangeRate: itemRate,
          cost: unitBase,
          subtotal: round2(unitBase * (Number(item.quantity) || 0)),
        };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchCurrency, watchExchangeRate]);

  // Si cambia la moneda de la sesión, limpia una cuenta bancaria incompatible.
  useEffect(() => {
    if (!watchReceivedBankAccountId) return;
    const selectedAccount = (bankAccounts as any[]).find(
      (account) => account.id === watchReceivedBankAccountId,
    );
    if (
      selectedAccount &&
      selectedAccount.currencyCode !== watchCurrency &&
      selectedAccount.currencyCode !== 'VES'
    ) {
      form.setValue('receivedBankAccountId', '');
    }
  }, [watchCurrency, watchReceivedBankAccountId, bankAccounts, form]);

  useEffect(() => {
    if (shouldFetch && !searching) {
      setShouldFetch(false);
      if (searchError) {
        toast.info({
          title: 'Asociado no encontrado',
          description: `Cédula: ${submittedSearch}`,
        });
        form.setValue('associateAccountId', '');
      } else if (associate?.associateAccountId) {
        form.setValue('associateAccountId', associate.associateAccountId);
        form.setValue('requestedAmount', round2(associate.available80));
      }
    }
  }, [
    searching,
    shouldFetch,
    searchError,
    associate,
    submittedSearch,
    form,
    toast,
  ]);

  useEffect(() => {
    if (hasAutoAmount) form.setValue('requestedAmount', effectiveAmount);
  }, [effectiveAmount, hasAutoAmount, form]);

  const handleSearch = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      toast.warning({
        title: 'Campo vacío',
        description: 'Ingrese una cédula.',
      });
      return;
    }
    queryClient.removeQueries({
      queryKey: [...QUERY_KEYS.withdrawals.all, 'request'],
    });
    setItems([]);
    setSupplierId('');
    setEnablePartialPayment(false);
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
    setEnablePartialPayment(false);
    form.reset(WITHDRAWAL_DEFAULTS);
    queryClient.removeQueries({
      queryKey: [...QUERY_KEYS.withdrawals.all, 'request'],
    });
  }, [queryClient, form]);

  const handlePartialPaymentToggle = useCallback(
    (enabled: boolean) => {
      setEnablePartialPayment(enabled);

      if (!enabled) {
        form.setValue('receivedAmount', 0);
        form.setValue('receivedReference', '');
        form.setValue('receivedBankAccountId', '');
        form.setValue('receivedPaymentMethod', 'BANK_TRANSFER');
        form.setValue('receivedAt', form.getValues('date'));
      }
    },
    [form],
  );

  const addProductItem = useCallback(
    async (productId: string) => {
      const p = await ProductsService.getById(productId);
      // El producto trae su propio precio/moneda. La sesión usa una sola
      // moneda y una sola tasa para todos los ítems.
      const productCurrency = (p.currencyCode ?? 'VES') as
        | 'VES'
        | 'USD'
        | 'EUR';
      const saleReference =
        p.salePrice ?? p.bsPriceAmount ?? p.supplierCost ?? 0;

      let sessionCurrency = watchCurrency as 'VES' | 'USD' | 'EUR';
      let factor = 1;

      if (productCurrency !== 'VES') {
        if (sessionCurrency !== 'VES' && sessionCurrency !== productCurrency) {
          toast.error({
            title: 'Moneda incompatible',
            description: `El producto está en ${productCurrency} y la sesión está en ${sessionCurrency}. Use una sola moneda para todos los productos.`,
          });
          return;
        }

        if (sessionCurrency === 'VES') {
          sessionCurrency = productCurrency;
          form.setValue('currencyCode', productCurrency);
        }

        if (
          productCurrency === sessionCurrency &&
          watchExchangeRate > 0
        ) {
          factor = watchExchangeRate;
        } else {
          try {
            const latest = await exchangeRatesService.getLatest(
              productCurrency,
            );
            const rate = Number(latest.rate);
            if (Number.isFinite(rate) && rate > 0) {
              factor = rate;
              form.setValue('exchangeRate', rate);
            }
          } catch {
            factor = 1;
          }
        }
      }

      const unitCost = round2(Number(saleReference) * factor);

      setItems((prev) => [
        ...prev,
        {
          type: 'product',
          productId,
          productName: p.name,
          unitPrice: Number(saleReference),
          currencyCode: productCurrency,
          exchangeRate: factor,
          unitCost,
          quantity: 1,
          totalCost: unitCost,
        },
      ]);
    },
    [watchCurrency, watchExchangeRate, form, toast],
  );

  const addServiceItem = useCallback(() => {
    const rate = watchCurrency !== 'VES' ? watchExchangeRate || 0 : 1;
    setItems((prev) => [
      ...prev,
      {
        type: 'service',
        description: '',
        quantity: 1,
        unitPrice: 0,
        currencyCode: watchCurrency,
        exchangeRate: rate,
        cost: 0,
        subtotal: 0,
      },
    ]);
  }, [watchCurrency, watchExchangeRate]);

  const updateItem = useCallback((index: number, field: string, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] } as any;
      item[field] = value;

      if (item.type === 'product') {
        if (
          field === 'unitPrice' ||
          field === 'exchangeRate'
        ) {
          item.unitCost = round2(
            Number(item.unitPrice || 0) * Number(item.exchangeRate || 1),
          );
        }
        if (
          field === 'quantity' ||
          field === 'unitCost' ||
          field === 'unitPrice' ||
          field === 'exchangeRate'
        ) {
          item.totalCost = round2(
            Number(item.quantity || 0) * Number(item.unitCost || 0),
          );
        }
      }

      if (item.type === 'service') {
        if (
          field === 'unitPrice' ||
          field === 'exchangeRate'
        ) {
          item.cost = round2(
            Number(item.unitPrice || 0) * Number(item.exchangeRate || 1),
          );
        }
        if (
          field === 'quantity' ||
          field === 'cost' ||
          field === 'unitPrice' ||
          field === 'exchangeRate'
        ) {
          item.subtotal = round2(
            Number(item.quantity || 0) * Number(item.cost || 0),
          );
        }
      }

      updated[index] = item;
      return updated;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = form.handleSubmit((data) => {
    if (!associate?.associateAccountId || !selectedType) return;

    let withdrawalItems: any[] = [];
    if (isGoodsWithdrawal) {
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
            currencyCode: i.currencyCode,
            exchangeRate: i.exchangeRate,
            originalUnitPrice: i.unitPrice,
            unitPriceBase: i.unitCost,
            totalBase: i.totalCost,
          }));
      } else {
        withdrawalItems = items
          .filter((i) => i.type === 'service')
          .map((i) => ({
            itemType: 'EXTERNAL',
            itemId: null,
            itemDescription: i.description,
            quantity: i.quantity,
            agreedSellingPrice: i.cost,
            days: i.specialDayCategoryId || null,
            currencyCode: i.currencyCode,
            exchangeRate: i.exchangeRate,
            originalUnitPrice: i.unitPrice,
            unitPriceBase: i.cost,
            totalBase: i.subtotal,
          }));
      }
    }

    const receivedAmount = isGoodsWithdrawal
      ? Number(watchReceivedAmount) || 0
      : 0;
    const hasReceivedPayment = receivedAmount > 0;

    const payload: Withdrawal = {
      ...data,
      associateAccountId: associate.associateAccountId,
      withdrawalTypeId: selectedType.id,
      requestedAmount: effectiveAmount,
      paymentMethod: hasAutoAmount ? 'BANK_TRANSFER' : data.paymentMethod,
      commercialHouseId:
        isGoodsWithdrawal && selectedType.isHouseComercial
          ? supplierId || null
          : null,
      currencyCode: isGoodsWithdrawal ? watchCurrency : 'VES',
      exchangeRate: isGoodsWithdrawal ? sessionRate : 1,
      goodsTotalAmount: isGoodsWithdrawal ? itemsTotal : undefined,
      withdrawalItems:
        withdrawalItems.length > 0 ? withdrawalItems : undefined,
      receivedAmount: hasReceivedPayment ? receivedAmount : undefined,
      receivedCurrencyCode: hasReceivedPayment ? watchCurrency : undefined,
      receivedExchangeRate: hasReceivedPayment ? sessionRate : undefined,
      receivedPaymentMethod: hasReceivedPayment
        ? watchReceivedPaymentMethod
        : undefined,
      receivedReference: hasReceivedPayment
        ? watchReceivedReference
        : undefined,
      receivedBankAccountId: hasReceivedPayment
        ? watchReceivedBankAccountId
        : undefined,
      receivedAt: hasReceivedPayment
        ? (watchReceivedAt ?? data.date)
        : undefined,
    };

    saveWithdrawal(payload, {
      onSuccess: () => {
        toast.success({
          title: 'Solicitud de retiro',
          description: 'Creada exitosamente para ' + associate.fullname,
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.withdrawals.lists(),
        });
        handleClear();
        onOpenChange(false);
      },
      onError: (err: unknown) => {
        toast.error({
          title: 'Error',
          description:
            (err as any)?.response?.data?.message ??
            (err as Error)?.message ??
            'No se pudo crear el retiro',
        });
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
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" /> Nueva Solicitud de Retiro
          </DialogTitle>
          <DialogDescription>
            Complete el formulario para crear una solicitud de retiro.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* SEARCH SECTION */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Ingrese Cédula del Asociado..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value.replace(/\D/g, '').slice(0, 8))
                }
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                disabled={searching}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searching}
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Buscar</span>
            </Button>
          </div>

          {searching && !associate && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground mt-2">
                Validando asociado...
              </p>
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
                  <span className="text-sm text-muted-foreground">
                    Nombre y Apellido:
                  </span>
                  <span className="text-sm font-bold">
                    {associate.fullname}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cédula:</span>
                  <span className="text-sm font-mono">{associate.cedula}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Nro. Cuenta:
                  </span>
                  <span className="text-sm font-mono font-semibold">
                    {associate.accountNumber}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-end">
                  <span className="text-sm text-muted-foreground">
                    Saldo Total:
                  </span>
                  <span className="text-lg font-black text-primary">
                    {formatCurrency(associate.balance || 0, 'VES')}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm text-muted-foreground">
                    80% Disponible:
                  </span>
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
              <p className="text-muted-foreground mt-2 text-sm">
                Ningún asociado seleccionado
              </p>
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
                        <span className="font-medium">
                          {selectedType.withdrawalPercentage ?? 100}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          % Gasto Admin:
                        </span>{' '}
                        <span className="font-medium">
                          {selectedType.administrativeFeePercentage ?? 0}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Inventario:
                        </span>{' '}
                        <span
                          className={`font-medium ${selectedType.isInternalInventory ? 'text-[#2EA640]' : 'text-muted-foreground'}`}
                        >
                          {selectedType.isInternalInventory ? 'Sí' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Casa Comercial:
                        </span>{' '}
                        <span
                          className={`font-medium ${selectedType.isHouseComercial ? 'text-[#2EA640]' : 'text-muted-foreground'}`}
                        >
                          {selectedType.isHouseComercial ? 'Sí' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PARÁMETROS ESPECIALES */}
                {showSpecialParams && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50/60 dark:bg-amber-900/10 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-semibold uppercase text-muted-foreground">
                        Parámetros Especiales
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Permite crear el retiro aunque el asociado tenga
                      condiciones bloqueantes. Solo disponible para usuarios con
                      permiso de parámetros especiales.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4 rounded-md border bg-background p-2.5">
                        <div className="pr-2">
                          <p className="text-sm font-medium">
                            Permitir superar el 80% disponible
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Omite el bloqueo por superar el 80% de haberes
                            disponibles y el % máximo configurado para el tipo
                            de retiro.
                          </p>
                        </div>
                        <Switch
                          checked={allowExceedAvailableBalance}
                          onCheckedChange={(v) =>
                            form.setValue('allowExceedAvailableBalance', v)
                          }
                        />
                      </div>
                      {(associate!.hasActiveLoan ||
                        associate!.hasActiveCredit) && (
                        <div className="flex items-center justify-between gap-4 rounded-md border bg-background p-2.5">
                          <div className="pr-2">
                            <p className="text-sm font-medium">
                              Permitir con préstamo o crédito
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Omite el bloqueo por préstamo o crédito activo.
                            </p>
                          </div>
                          <Switch
                            checked={allowWithActiveLoanOrCredit}
                            onCheckedChange={(v) =>
                              form.setValue('allowWithActiveLoanOrCredit', v)
                            }
                          />
                        </div>
                      )}
                      {associate!.hasPayrollCredit && (
                        <div className="flex items-center justify-between gap-4 rounded-md border bg-background p-2.5">
                          <div className="pr-2">
                            <p className="text-sm font-medium">
                              Permitir con credinomina
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Omite el bloqueo por credinomina activa.
                            </p>
                          </div>
                          <Switch
                            checked={allowWithPayrollCredit}
                            onCheckedChange={(v) =>
                              form.setValue('allowWithPayrollCredit', v)
                            }
                          />
                        </div>
                      )}
                      {timeRuleBlocked && (
                        <div className="flex items-center justify-between gap-4 rounded-md border bg-background p-2.5">
                          <div className="pr-2">
                            <p className="text-sm font-medium">
                              Permitir antes del tiempo mínimo
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Omite la espera mínima entre retiros.
                            </p>
                          </div>
                          <Switch
                            checked={allowEarlyWithdrawal}
                            onCheckedChange={(v) =>
                              form.setValue('allowEarlyWithdrawal', v)
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MONEDA Y TASA DE LA SESIÓN */}
                {isGoodsWithdrawal && (
                  <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span className="text-sm font-semibold uppercase text-muted-foreground">
                        Moneda y Tasa del Retiro
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Moneda *
                        </span>
                        <Select
                          value={watchCurrency}
                          onValueChange={(value) => {
                            form.setValue(
                              'currencyCode',
                              value as 'VES' | 'USD' | 'EUR',
                            );
                            form.setValue('receivedBankAccountId', '');
                          }}
                          disabled={saving}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VES">
                              Bolívares (VES)
                            </SelectItem>
                            <SelectItem value="USD">
                              Dólares (USD)
                            </SelectItem>
                            <SelectItem value="EUR">Euros (EUR)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {watchCurrency !== 'VES' && (
                        <div>
                          <span className="text-xs text-muted-foreground">
                            Tasa de Cambio ({watchCurrency}) *
                          </span>
                          <Input
                            type="number"
                            step="0.0001"
                            min="0"
                            className="mt-1"
                            value={watchExchangeRate || ''}
                            onChange={(e) =>
                              form.setValue(
                                'exchangeRate',
                                Number(e.target.value) || 0,
                              )
                            }
                            disabled={saving}
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Esta moneda y tasa se aplican a todos los productos y al
                      pago parcial recibido.
                    </p>
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
                          onChange={(e) =>
                            setProductSearchQuery(e.target.value)
                          }
                          autoFocus
                          className="h-8 text-xs"
                        />
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {products
                            .filter((p) => {
                              if (!productSearchQuery) return true;
                              const q = productSearchQuery.toLowerCase();
                              return (p.name ?? '').toLowerCase().includes(q);
                            })
                            .slice(0, 20)
                            .map((p) => (
                              <div
                                key={p.id}
                                onClick={() => {
                                  addProductItem(p.id!);
                                  setShowProductSearch(false);
                                }}
                                className="flex items-center px-3 py-2 rounded-md cursor-pointer hover:bg-muted text-xs"
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
                        <div
                          key={idx}
                          className="flex gap-2 items-end border rounded-md p-2 flex-wrap"
                        >
                          <div className="flex-1 min-w-[120px]">
                            <span className="text-xs text-muted-foreground">
                              {item.productName}
                            </span>
                          </div>
                          <div className="w-20">
                            <span className="text-xs text-muted-foreground">
                              Cant
                            </span>
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  'quantity',
                                  Number(e.target.value),
                                )
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="w-24">
                            <span className="text-xs text-muted-foreground">
                              Precio {item.currencyCode ?? 'VES'}
                            </span>
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={item.unitPrice ?? ''}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(
                                  /[^0-9.]/g,
                                  '',
                                );
                                updateItem(
                                  idx,
                                  'unitPrice',
                                  cleaned ? parseFloat(cleaned) : 0,
                                );
                              }}
                              className="h-8 text-xs font-mono"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="w-28">
                            <span className="text-xs text-muted-foreground">
                              Precio Bs.
                            </span>
                            <div className="h-8 flex items-center text-xs font-mono">
                              {item.unitCost?.toLocaleString('es', {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                          <div className="w-24 text-right">
                            <span className="text-xs text-muted-foreground">
                              Subtotal
                            </span>
                            <div className="h-8 flex items-center justify-end text-xs font-mono">
                              {item.totalCost?.toLocaleString('es', {
                                minimumFractionDigits: 2,
                              })}
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

                {/* CASA COMERCIAL / ITEMS MANUALES */}
                {(selectedType?.isHouseComercial || isManualGoods) && (
                  <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="text-sm font-semibold uppercase text-muted-foreground">
                        {selectedType?.isHouseComercial
                          ? 'Casa Comercial'
                          : 'Productos / Servicios'}
                      </span>
                    </div>
                    {selectedType?.isHouseComercial && (
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Proveedor *
                        </span>
                        <select
                          value={supplierId}
                          onChange={(e) => setSupplierId(e.target.value)}
                          className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#3098F2] mt-1"
                        >
                          <option value="">Seleccionar proveedor...</option>
                          {serviceSuppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        {serviceSuppliers.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            No hay proveedores de servicios registrados.
                          </p>
                        )}
                      </div>
                    )}
                    {(!selectedType?.isHouseComercial || supplierId) && (
                      <div className="space-y-2">
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={addServiceItem}
                            className="gap-1"
                          >
                            <Plus className="h-3 w-3" /> Agregar Item
                          </Button>
                        </div>
                        {items
                          .filter((i) => i.type === 'service')
                          .map((item, idx) => (
                            <div
                              key={idx}
                              className="flex gap-2 items-end border rounded-md p-2 flex-wrap"
                            >
                              <div className="flex-1">
                                <span className="text-xs text-muted-foreground">
                                  Descripción
                                </span>
                                <Input
                                  value={item.description}
                                  onChange={(e) =>
                                    updateItem(
                                      idx,
                                      'description',
                                      e.target.value,
                                    )
                                  }
                                  className="h-8 text-xs"
                                  placeholder="Ej: Instalación"
                                />
                              </div>
                              <div className="w-16">
                                <span className="text-xs text-muted-foreground">
                                  Cant
                                </span>
                                <Input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItem(
                                      idx,
                                      'quantity',
                                      Number(e.target.value),
                                    )
                                  }
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="w-28">
                                <span className="text-xs text-muted-foreground">
                                  Precio ({watchCurrency})
                                </span>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    item.unitPrice && item.unitPrice > 0
                                      ? String(item.unitPrice)
                                      : ''
                                  }
                                  onChange={(e) => {
                                    const cleaned = e.target.value.replace(
                                      /[^0-9.]/g,
                                      '',
                                    );
                                    const num = cleaned
                                      ? parseFloat(cleaned)
                                      : 0;
                                    updateItem(idx, 'unitPrice', num);
                                  }}
                                  className="h-8 text-xs font-mono"
                                  placeholder="0,00"
                                />
                              </div>
                              <div className="w-24">
                                <span className="text-xs text-muted-foreground">
                                  Precio Bs.
                                </span>
                                <div className="h-8 flex items-center text-xs font-mono">
                                  {item.cost?.toLocaleString('es', {
                                    minimumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                              <div className="w-24 text-right">
                                <span className="text-xs text-muted-foreground">
                                  Subtotal
                                </span>
                                <div className="h-8 flex items-center justify-end text-xs font-mono">
                                  {item.subtotal?.toLocaleString('es', {
                                    minimumFractionDigits: 2,
                                  })}
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

                {/* PAGO PARCIAL RECIBIDO */}
                {isGoodsWithdrawal && (
                  <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        <span className="text-sm font-semibold uppercase text-muted-foreground">
                          Pago Parcial Recibido
                        </span>
                      </div>
                      <Switch
                        checked={enablePartialPayment}
                        onCheckedChange={handlePartialPaymentToggle}
                        disabled={saving}
                      />
                    </div>
                    {enablePartialPayment && (
                      <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Monto recibido ({watchCurrency})
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="mt-1"
                          value={watchReceivedAmount || ''}
                          onChange={(e) =>
                            form.setValue(
                              'receivedAmount',
                              Number(e.target.value) || 0,
                            )
                          }
                          disabled={saving}
                        />
                        {watchReceivedAmount > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Equivalente: {formatCurrency(receivedBase, 'VES')}
                          </p>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Método de pago
                        </span>
                        <Select
                          value={watchReceivedPaymentMethod}
                          onValueChange={(value) =>
                            form.setValue(
                              'receivedPaymentMethod',
                              value as any,
                            )
                          }
                          disabled={saving}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Método" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PAYMENT_METHOD).map(([k, v]) => (
                              <SelectItem key={k} value={k}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Referencia
                        </span>
                        <Input
                          className="mt-1"
                          value={watchReceivedReference}
                          onChange={(e) =>
                            form.setValue(
                              'receivedReference',
                              e.target.value,
                            )
                          }
                          placeholder="Nro. referencia / comprobante"
                          disabled={saving}
                        />
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Cuenta bancaria receptora
                        </span>
                        <Select
                          value={watchReceivedBankAccountId}
                          onValueChange={(value) =>
                            form.setValue('receivedBankAccountId', value)
                          }
                          disabled={
                            saving || receivedBankAccounts.length === 0
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue
                              placeholder={
                                receivedBankAccounts.length > 0
                                  ? 'Seleccionar cuenta...'
                                  : `Sin cuentas en ${watchCurrency}`
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {receivedBankAccounts.map((account: any) => (
                              <SelectItem
                                key={account.id}
                                value={account.id}
                              >
                                {account.accountName ||
                                  `Cuenta ${account.accountNumber}`}{' '}
                                - {account.accountNumber} ({account.currencyCode})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          Fecha del pago
                        </span>
                        <CustomCalendar
                          className="mt-1"
                          value={
                            watchReceivedAt
                              ? new Date(watchReceivedAt)
                              : null
                          }
                          onChange={(date) => {
                            if (date) form.setValue('receivedAt', date);
                          }}
                          disabled={saving}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      El saldo restante se descuenta automáticamente de los
                      haberes.
                    </p>
                      </>
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
                      <span className="text-xs text-muted-foreground">
                        {isGoodsWithdrawal ? 'Monto a retirar *' : 'Monto *'}
                      </span>
                      {hasAutoAmount ? (
                        <div className="h-9 flex items-center px-3 rounded-md border bg-background text-sm font-mono mt-1">
                          {effectiveAmount.toLocaleString('es', {
                            minimumFractionDigits: 2,
                          })}{' '}
                          Bs
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
                              form.setValue(
                                'requestedAmount',
                                Number(e.target.value) || 0,
                              )
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
                  {isGoodsWithdrawal && (
                    <div className="rounded-md border bg-background p-3 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Total productos:</span>
                        <span className="font-mono">
                          {formatCurrency(itemsTotal, 'VES')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pago recibido:</span>
                        <span className="font-mono">
                          {formatCurrency(receivedBase, 'VES')}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Monto a retirar:</span>
                        <span className="font-mono">
                          {formatCurrency(effectiveAmount, 'VES')}
                        </span>
                      </div>
                    </div>
                  )}
                  {effectiveAmount > 0 && selectedType && (
                    <div className="text-sm text-muted-foreground">
                      <span>Comisión Admin ({feePct}%): </span>
                      <span className="font-mono">
                        {fee.toLocaleString('es', { minimumFractionDigits: 2 })}{' '}
                        Bs |{' '}
                      </span>
                      <span>Desembolsar: </span>
                      <span className="font-mono font-semibold text-[#2EA640]">
                        {disbursed.toLocaleString('es', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        Bs
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
                      {rules.canSave
                        ? 'Reglas Cumplidas'
                        : 'Reglas Bloqueantes'}
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClose}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" size="sm" disabled={isFormDisabled}>
                      {saving ? (
                        <>
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />{' '}
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Solicitar
                          Retiro
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          )}
        </div>

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
