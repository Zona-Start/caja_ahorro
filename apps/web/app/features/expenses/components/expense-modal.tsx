import { useExpenseModalStore } from '../store/expense-modal.store';
import { ExpenseWizardModal } from './expense-wizard/expense-wizard-modal';

export function ExpenseModal() {
  const { isOpen, closeModal, nature } = useExpenseModalStore();

  return (
    <ExpenseWizardModal
      open={isOpen}
      nature={nature}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
    />
  );
}
