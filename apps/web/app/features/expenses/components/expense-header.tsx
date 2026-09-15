import { Button } from '@repo/shadcn/button';
import { Heading } from '@repo/shadcn/heading';
import { useExpenseModalStore } from '../store/expense-modal.store';

export function ExpenseHeader() {
  const openModal = useExpenseModalStore((s) => s.openModal);

  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Gastos"
        description="Control de gastos y egresos de efectivo, bancos y fondos fijos"
      />
      <Button onClick={() => openModal('create')}>Registrar Gasto</Button>
    </div>
  );
}
