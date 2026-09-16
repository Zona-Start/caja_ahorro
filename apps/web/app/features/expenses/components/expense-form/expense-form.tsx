import { useBusinessType } from '@/lib/business-type';
import { useExpenseModeQuery } from '../../hooks/use-expense-queries';
import { AgileExpenseForm } from './agile-expense-form';
import { CorporateExpenseForm } from './corporate-expense-form';

interface ExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExpenseForm({ onSuccess, onCancel }: ExpenseFormProps) {
  const { data: modeData, isLoading } = useExpenseModeQuery();
  const businessType = useBusinessType();
  const isCommerce = businessType === 'EMPRESA_COMERCIAL';
  const mode = modeData?.data?.mode ?? 'CORPORATE';

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
      </div>
    );
  }

  // Commerce tenants always use the simplified (agile) expense form, even if
  // the tenant has the accounting module enabled.
  if (isCommerce || mode === 'AGILE') {
    return <AgileExpenseForm onSuccess={onSuccess} onCancel={onCancel} />;
  }

  return <CorporateExpenseForm onSuccess={onSuccess} onCancel={onCancel} />;
}
