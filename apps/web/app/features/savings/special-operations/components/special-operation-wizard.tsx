'use client';

import { Button } from '@repo/shadcn/button';
import { cn } from '@repo/shadcn/lib/utils';
import { X } from 'lucide-react';
import { useSpecialOperationWizardStore } from '../store/special-operation-wizard.store';
import { StepAccountConfig } from './steps/step-account-config';
import { StepConfirm } from './steps/step-confirm';
import { StepOperationType } from './steps/step-operation-type';
import { StepPreviewTable } from './steps/step-preview-table';
import { StepUploadFile } from './steps/step-upload-file';

const STEPS = [
  { step: 1, label: 'Tipo' },
  { step: 2, label: 'Archivo' },
  { step: 3, label: 'Vista previa' },
  { step: 4, label: 'Contabilidad' },
  { step: 5, label: 'Confirmar' },
] as const;

export function SpecialOperationWizard() {
  const step = useSpecialOperationWizardStore((state) => state.step);
  const reset = useSpecialOperationWizardStore((state) => state.reset);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {STEPS.map((item, index) => {
            const active = step === item.step;
            const completed = step > item.step;

            return (
              <div key={item.step} className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : completed
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {item.step}
                </div>
                <span
                  className={cn(
                    'text-xs sm:text-sm',
                    active
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  {item.label}
                </span>
                {index < STEPS.length - 1 && (
                  <div className="hidden h-px w-6 bg-border sm:block" />
                )}
              </div>
            );
          })}
        </div>

        <Button variant="ghost" size="sm" onClick={reset}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-4 sm:p-6">
        {step === 1 && <StepOperationType />}
        {step === 2 && <StepUploadFile />}
        {step === 3 && <StepPreviewTable />}
        {step === 4 && <StepAccountConfig />}
        {step === 5 && <StepConfirm />}
      </div>
    </div>
  );
}
