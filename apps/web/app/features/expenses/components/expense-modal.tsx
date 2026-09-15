import { useExpenseModalStore } from '../store/expense-modal.store';
import { ExpenseWizardModal } from './expense-wizard/expense-wizard-modal';

export function ExpenseModal() {
  const { isOpen, closeModal } = useExpenseModalStore();

  return (
    <ExpenseWizardModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    />
  );
}
