'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { AccountingRule } from '../schemas/accounting-rule.schema';
import { AccountingRuleForm } from './accounting-rule-form';

interface AccountingRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<AccountingRule>;
  readOnly?: boolean;
}

export function AccountingRuleModal({
  open,
  onOpenChange,
  defaultValues,
  readOnly = false,
}: AccountingRuleModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-[900px] z-50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? 'Ver Regla Contable'
              : defaultValues?.id
                ? 'Actualizar Regla Contable'
                : 'Crear Regla Contable'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Detalles de la regla contable seleccionada.'
              : `Complete la información para ${defaultValues?.id ? 'actualizar' : 'crear'} la regla y sus detalles.`}
          </DialogDescription>
        </DialogHeader>
        <AccountingRuleForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
