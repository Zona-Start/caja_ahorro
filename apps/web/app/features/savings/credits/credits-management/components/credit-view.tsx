'use client';

import { useNavigate } from 'react-router';
import { useState, useCallback } from 'react';
import { useCreateCreditManagementMutation } from '../hooks/use-credits-management-mutation';
import { type CreditManagement } from '../schemas/credits-management.schema';
import { type SearchAssociateResult } from '../schemas/credits-management-api-response';
import { CreditForm } from './credit-form';
import { CreditSearch } from './credit-search';
import { CreditSummary } from './credit-summary';

interface CreditViewProps {
  isEdit?: boolean;
  initialData?: Partial<CreditManagement>;
}

export function CreditView({ isEdit = false, initialData }: CreditViewProps) {
  const navigate = useNavigate();
  const [selectedAssociate, setSelectedAssociate] =
    useState<SearchAssociateResult | null>(null);

  const { mutate: saveCredit, isPending: isSaving } =
    useCreateCreditManagementMutation();

  const handleSubmit = useCallback(
    (data: CreditManagement) => {
      saveCredit(data, {
        onSuccess: () => {
          navigate('/dashboard/caja-ahorro/creditos/gestion');
        },
      });
    },
    [saveCredit, navigate],
  );

  const handleCancel = useCallback(() => {
    navigate('/dashboard/caja-ahorro/creditos/gestion');
  }, [navigate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEdit ? 'Actualización de Crédito' : 'Creación de Crédito'}
        </h1>
        <p className="text-muted-foreground">
          Complete el formulario para {isEdit ? 'actualizar' : 'crear'} un
          crédito para un asociado
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <CreditSearch
            selectedAssociate={selectedAssociate}
            onSelectAssociate={setSelectedAssociate}
          />
          {selectedAssociate && (
            <CreditForm
              selectedAssociate={selectedAssociate}
              isSubmitting={isSaving}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isEdit={isEdit}
              initialData={initialData}
            />
          )}
        </div>
        <div className="relative lg:col-span-1">
          <div className="sticky top-24">
            <CreditSummary
              selectedAssociate={selectedAssociate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
