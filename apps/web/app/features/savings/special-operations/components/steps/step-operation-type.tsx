'use client';

import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { cn } from '@repo/shadcn/lib/utils';
import { ArrowRight, CheckCircle2, HandCoins, Landmark } from 'lucide-react';
import {
  OPERATION_DESCRIPTIONS,
  OPERATION_LABELS,
  type SpecialOperationType,
} from '../../schemas/special-operations.schema';
import { useSpecialOperationWizardStore } from '../../store/special-operation-wizard.store';

const OPTIONS: Array<{
  type: SpecialOperationType;
  icon: typeof Landmark;
}> = [
  { type: 'LIQUIDATION_VS_INCOME', icon: Landmark },
  { type: 'LOAN_WITHDRAWAL_VS_SAVINGS', icon: HandCoins },
];

export function StepOperationType() {
  const operationType = useSpecialOperationWizardStore(
    (state) => state.operationType,
  );
  const setOperationType = useSpecialOperationWizardStore(
    (state) => state.setOperationType,
  );
  const next = useSpecialOperationWizardStore((state) => state.next);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Tipo de operación</h2>
        <p className="text-sm text-muted-foreground">
          Selecciona la operación especial que deseas ejecutar.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {OPTIONS.map(({ type, icon: Icon }) => {
          const selected = operationType === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() => setOperationType(type)}
              className="text-left"
            >
              <Card
                className={cn(
                  'h-full transition-colors',
                  selected
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'hover:border-primary/50',
                )}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">
                        {OPERATION_LABELS[type]}
                      </CardTitle>
                    </div>
                    <CardDescription>
                      {OPERATION_DESCRIPTIONS[type]}
                    </CardDescription>
                  </div>
                  {selected && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  )}
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {type === 'LIQUIDATION_VS_INCOME'
                      ? 'Se genera una liquidación, se cancelan deudas y el neto se aplica a una cuenta de ingreso.'
                      : 'Se descuenta únicamente el capital del préstamo. El interés no se cobra.'}
                  </p>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={next} disabled={!operationType}>
          Continuar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
