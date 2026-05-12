import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from '@repo/shadcn/toast';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { useSaveWithdrawalMutation } from '../hooks/use-withdrawal-query';
import { useWithdrawalStore } from '../store/withdrawal-store';
import { WithdrawalForm } from './withdrawal-form';
import { WithdrawalSearch } from './withdrawal-search';
import { WithdrawalSummary } from './withdrawal-summary';

interface WithdrawalViewProps {
  isEdit?: boolean;
  initialData?: any;
}

export function WithdrawalView({ isEdit = false, initialData }: WithdrawalViewProps) {
  const {
    selectedAssociate,
    setSelectedAssociate,
    setShouldClearSearch,
    setWithdrawalSummary,
    formValues,
    setFormValues,
    clearAllWithdrawalData,
    setSelectedWithdrawalType,
  } = useWithdrawalStore();

  const [isEditActive, setIsEditActive] = useState(isEdit);
  const [currentCurrencyCode, setCurrentCurrencyCode] = useState<string>('VES');
  const [currentExchangeRate, setCurrentExchangeRate] = useState<number>(1);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate: saveWithdrawal, isPending: isSubmitting } = useSaveWithdrawalMutation();

  const emptyFormValues = {
    id: 0,
    associateAccountId: 0,
    withdrawalDate: new Date(),
    withdrawalTypeId: 0,
    requestedAmount: '',
    paymentMethod: 'BANK_TRANSFER',
  };

  useEffect(() => {
    return () => {
      clearAllWithdrawalData();
    };
  }, [clearAllWithdrawalData]);

  const handleSubmit = (data: any) => {
    saveWithdrawal(data, {
      onSuccess: () => {
        toast.success(
          `Se ha registrado un pago de retiro de ${currentCurrencyCode === 'VES' ? 'Bs ' : '$ '} ${data.requestedAmount} para ${selectedAssociate?.fullname}.`
        );
        handleCancel();
      },
    });
  };

  const handleCancel = () => {
    clearAllWithdrawalData();
    navigate('/dashboard/caja-ahorro/retiros');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEdit ? 'Actualización de Retiro' : 'Creación Retiro'}
        </h1>
        <p className="text-muted-foreground">
          Complete el formulario para{' '}
          {isEdit ? 'actualizar un retiro' : 'crear un nuevo retiro'} haberes
          para un asociado
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <WithdrawalSearch
              currentCurrencyCode={currentCurrencyCode}
              currentExchangeRate={currentExchangeRate}
              isEdit={isEditActive}
            />
          </div>
          <div>
            <WithdrawalForm
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              currentCurrencyCode={currentCurrencyCode}
              currentExchangeRate={currentExchangeRate}
              initialData={isEditActive ? formValues : emptyFormValues}
              isEdit={isEditActive}
            />
          </div>
        </div>
        <div className="relative lg:col-span-1">
          <div className="sticky top-24 @5xl:col-span-4 @5xl:mt-0 @6xl:col-span-3 2xl:top-28">
            <WithdrawalSummary
              currentCurrencyCode={currentCurrencyCode}
              currentExchangeRate={currentExchangeRate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
