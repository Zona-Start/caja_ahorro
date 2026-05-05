'use client';
import { IconWrapper } from '@/components/icon-wrapper';
import { AlertModal } from '@/components/modal/alert-modal';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Badge } from '@repo/shadcn/badge';
import { CustomCalendar } from '@repo/shadcn/custom-calendar';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { Textarea } from '@repo/shadcn/textarea';
import {
  CalendarDays,
  Check,
  CreditCard,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { useTypeCreditsQuery } from '../type-credits/hooks/use-type-credits-query';
import { useProductsQuery } from './hooks/use-products-query';
import { useSupplierAllQuery } from '@/features/administration/suppliers/hooks/use-suppliers-query';
import { useCategoriesTypesGroupQuery } from '@/features/common/category-types/hooks/use-category-types-query';
import { CREDIT_MODALITY } from '../schemas/credits-management-options';
import { creditManagementSchema, type CreditManagement } from '../schemas/credits-management.schema';
import { type AssociatesLoan } from '../schemas/individual-credit-api-schema';

interface CreditFormProps {
  selectedAssociate: AssociatesLoan | null;
  isSubmitting: boolean;
  onSubmit: (data: CreditManagement) => void;
  onCancel: () => void;
  loanSummary: any | null;
  onFormChange: (values: any) => void;
  currentCurrencyCode?: string;
  currentExchangeRate?: number;
}

const COMMERCIAL_HOUSE_NONE = 'none';
const COMMERCIAL_HOUSE_INTERNAL = 'internal_inventory';

export function CreditForm({
  selectedAssociate,
  isSubmitting,
  onSubmit,
  onCancel,
  loanSummary,
  onFormChange,
  currentCurrencyCode = 'VES',
  currentExchangeRate,
}: CreditFormProps) {
  const [exceedingAvailability, setExceedingAvailability] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [dataToSubmit, setDataToSubmit] = useState<any>(null);

  const { data: withdrawlTypes } = useTypeCreditsQuery();
  const { data: productsData } = useProductsQuery();
  const { data: suppliers } = useSupplierAllQuery();
  const { data: daysType } = useCategoriesTypesGroupQuery('DAYS_TYPE');
  const availableProducts = productsData?.data || [];

  const form = useForm<CreditManagement>({
    resolver: zodResolver(creditManagementSchema),
    defaultValues: {
      id: '0',
      associateId: 0,
      creditTypeId: '',
      creditModality: '',
      requestDate: new Date(),
      requestedAmount: '',
      startDate: new Date(),
      endDate: '',
      termMonths: '',
      status: 'REQUESTED',
      interestRate: '',
      installmentsCount: '',
      expensesAmount: '',
      overdraftAmount: null,
      notes: '',
      commercialHouseId: COMMERCIAL_HOUSE_NONE,
      invoiceNumber: '',
      products: [],
      items: [],
      useCommercialHouse: false,
      termUnits: '',
      termType: 'Plazos',
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'products' });
  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control: form.control, name: 'items' });

  const commercialHouseId = form.watch('commercialHouseId');
  const showInternalInventory = commercialHouseId === COMMERCIAL_HOUSE_INTERNAL;
  const showCommercialItems = commercialHouseId && commercialHouseId !== COMMERCIAL_HOUSE_NONE && commercialHouseId !== COMMERCIAL_HOUSE_INTERNAL;

  const handleSubmit = form.handleSubmit((data) => {
    setDataToSubmit(data);
    setConfirmOpen(true);
  });

  const onConfirm = () => {
    onSubmit(dataToSubmit);
    setConfirmOpen(false);
  };

  return (
    <>
      <AlertModal
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirm}
        loading={isSubmitting}
        title="Confirmar Crédito"
        description="¿Está seguro que desea registrar este crédito? Esta operación afectará el saldo del asociado."
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconWrapper className="w-8 h-8">
              <CreditCard />
            </IconWrapper>
            Datos del Crédito
          </CardTitle>
          <CardDescription>Ingrese la información del crédito a otorgar</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField
                control={form.control}
                name="creditTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Crédito</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccione el tipo" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {withdrawlTypes?.data?.map((type: any) => (
                          <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {/* Form implementation continues similarly */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>Registrar Crédito</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
