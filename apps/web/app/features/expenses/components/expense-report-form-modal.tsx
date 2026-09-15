import { useUsersQuery } from '@/features/core/users/hooks/use-users-queries';
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
import { Plus, Ticket, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useExpenseCategories } from '../hooks/use-expense-categories-query';
import { useCreateExpenseReportMutation } from '../hooks/use-expense-reports-queries';

interface ExpenseReportFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ItemLine {
  categoryId: string;
  description: string;
  amount: string;
  receiptImageUrl: string;
}

const EMPTY_ITEM: ItemLine = {
  categoryId: '',
  description: '',
  amount: '',
  receiptImageUrl: '',
};

const toFixed2 = (value: number) =>
  value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function ExpenseReportFormModal({
  open,
  onOpenChange,
}: ExpenseReportFormModalProps) {
  const { data: usersData } = useUsersQuery({ page: 1, limit: 100 });
  const { data: categoriesData } = useExpenseCategories();
  const createMutation = useCreateExpenseReportMutation();

  const users = useMemo(() => usersData?.data ?? [], [usersData]);
  const categories = categoriesData?.data ?? [];

  const [employeeUserId, setEmployeeUserId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<ItemLine[]>([{ ...EMPTY_ITEM }]);

  const total = items.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );
  const allLinesValid = items.every(
    (item) => item.categoryId && item.description && Number(item.amount) > 0,
  );

  const updateItem = (index: number, field: keyof ItemLine, value: string) => {
    setItems((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
    );
  };

  const submit = () => {
    createMutation.mutate(
      {
        employeeUserId: employeeUserId || '',
        title,
        description: description || '',
        currencyCode: 'VES',
        items: items
          .filter((i) => i.categoryId && i.description && Number(i.amount) > 0)
          .map((item) => ({
            categoryId: item.categoryId,
            description: item.description,
            amount: Number(item.amount),
            receiptImageUrl: item.receiptImageUrl || '',
          })),
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      },
    );
  };

  const resetForm = () => {
    setEmployeeUserId('');
    setTitle('');
    setDescription('');
    setItems([{ ...EMPTY_ITEM }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" /> Nuevo Reporte de Reembolso
          </DialogTitle>
          <DialogDescription>
            Agrega cada ticket de gasto: el sistema calcula el total para el
            reembolso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">Título *</span>
              <Input
                className="mt-1"
                placeholder="Ej: Viáticos Barcelona - Marzo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Empleado</span>
              <Select
                value={employeeUserId || 'ME'}
                onValueChange={(v) => setEmployeeUserId(v === 'ME' ? '' : v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ME">Yo (usuario actual)</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <span className="text-xs text-muted-foreground">Descripción</span>
            <Input
              className="mt-1"
              placeholder="Ej: Cena con cliente + taxis del viaje"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase text-muted-foreground">
                Tickets / Items ({items.length})
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}
              >
                <Plus className="h-3 w-3" /> Añadir
              </Button>
            </div>

            {items.map((item, idx) => (
              <div
                key={idx}
                className="border rounded-md p-2 bg-background space-y-2"
              >
                <div className="flex gap-2 items-end flex-wrap">
                  <div className="flex-1 min-w-[140px]">
                    <span className="text-xs text-muted-foreground">
                      Categoría *
                    </span>
                    <Select
                      value={item.categoryId}
                      onValueChange={(v) => updateItem(idx, 'categoryId', v)}
                    >
                      <SelectTrigger className="h-9 mt-1">
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <span className="text-xs text-muted-foreground">
                      Descripción *
                    </span>
                    <Input
                      className="h-9 mt-1"
                      placeholder="Ej: Taxi aeropuerto"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(idx, 'description', e.target.value)
                      }
                    />
                  </div>
                  <div className="w-24">
                    <span className="text-xs text-muted-foreground">
                      Monto *
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-9 mt-1 font-mono"
                      placeholder="0,00"
                      value={item.amount}
                      onChange={(e) =>
                        updateItem(idx, 'amount', e.target.value)
                      }
                    />
                  </div>
                  <div className="w-32">
                    <span className="text-xs text-muted-foreground">
                      Foto ticket (URL)
                    </span>
                    <Input
                      className="h-9 mt-1"
                      placeholder="https://..."
                      value={item.receiptImageUrl}
                      onChange={(e) =>
                        updateItem(idx, 'receiptImageUrl', e.target.value)
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive"
                    onClick={() =>
                      setItems((prev) =>
                        prev.length > 1
                          ? prev.filter((_, i) => i !== idx)
                          : prev,
                      )
                    }
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-between text-sm pt-1 border-t">
              <span className="text-muted-foreground">Total del reporte</span>
              <span className="font-mono font-bold text-primary">
                {toFixed2(total)} Bs
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                !title ||
                countValidLines(items) === 0 ||
                createMutation.isPending
              }
              onClick={submit}
            >
              {createMutation.isPending ? 'Enviando...' : 'Enviar Reporte'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function countValidLines(items: ItemLine[]): number {
  return items.filter(
    (i) => i.categoryId && i.description && Number(i.amount) > 0,
  ).length;
}
