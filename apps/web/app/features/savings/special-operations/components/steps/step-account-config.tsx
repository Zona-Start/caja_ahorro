'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { formatCurrency } from '@/lib/format-utils';
import { Alert, AlertDescription, AlertTitle } from '@repo/shadcn/alert';
import { Button } from '@repo/shadcn/button';
import { Checkbox } from '@repo/shadcn/checkbox';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  useSaveSpecialOperationConfigMutation,
  useSpecialOperationAccountsQuery,
  useSpecialOperationConfigQuery,
} from '../../hooks/use-special-operations';
import {
  type SpecialOperationAccountConfigItem,
  type SpecialOperationMovementType,
  type SpecialOperationRole,
} from '../../schemas/special-operations.schema';
import { useSpecialOperationWizardStore } from '../../store/special-operation-wizard.store';

export function StepAccountConfig() {
  const toast = useToastSystem();

  const preview = useSpecialOperationWizardStore((state) => state.preview);
  const operationType = useSpecialOperationWizardStore(
    (state) => state.operationType,
  );
  const setAccountConfig = useSpecialOperationWizardStore(
    (state) => state.setAccountConfig,
  );
  const back = useSpecialOperationWizardStore((state) => state.back);
  const next = useSpecialOperationWizardStore((state) => state.next);

  const accountsQuery = useSpecialOperationAccountsQuery();
  const configQuery = useSpecialOperationConfigQuery(operationType);
  const saveMutation = useSaveSpecialOperationConfigMutation();

  const [details, setDetails] = useState<
    SpecialOperationAccountConfigItem[]
  >([]);

  const requiredRoles = useMemo(
    () => (preview?.roles ?? []).filter((role) => role.required),
    [preview],
  );

  useEffect(() => {
    if (!preview || !operationType) return;

    const savedByRole = new Map(
      (configQuery.data?.details ?? []).map((detail) => [
        detail.role,
        detail,
      ]),
    );

    setDetails(
      requiredRoles.map((role) => {
        const saved = savedByRole.get(role.role);
        const allowsAuxiliary = role.defaultIsAuxiliary !== false;
        return {
          role: role.role,
          label: role.label,
          accountPlanId: saved?.accountPlanId ?? '',
          movementType:
            saved?.movementType ?? role.defaultMovementType,
          isAuxiliary: allowsAuxiliary
            ? (saved?.isAuxiliary ?? true)
            : false,
        };
      }),
    );
  }, [preview, operationType, configQuery.data, requiredRoles]);

  const accounts = useMemo(
    () =>
      (accountsQuery.data ?? []).filter(
        (account) => account.allowsMovements && account.isActive,
      ),
    [accountsQuery.data],
  );

  const roleTotal = (role: string) =>
    Number(requiredRoles.find((item) => item.role === role)?.total ?? 0);

  const totalBy = (movementType: SpecialOperationMovementType) =>
    details.reduce((total, detail) => {
      if (detail.movementType !== movementType) return total;
      return total + roleTotal(detail.role);
    }, 0);

  const debitTotal = totalBy('DEBIT');
  const creditTotal = totalBy('CREDIT');
  const isBalanced = Math.abs(debitTotal - creditTotal) < 0.01;
  const isReady =
    requiredRoles.length > 0 &&
    details.length === requiredRoles.length;
  const isComplete = requiredRoles.every((role) =>
    details.some(
      (detail) => detail.role === role.role && detail.accountPlanId,
    ),
  );

  const updateDetail = (
    role: string,
    patch: Partial<SpecialOperationAccountConfigItem>,
  ) => {
    setDetails((current) =>
      current.map((detail) =>
        detail.role === role ? { ...detail, ...patch } : detail,
      ),
    );
  };

  const handleContinue = () => {
    if (!operationType || !isReady) return;

    if (!isComplete) {
      toast.error({
        title: 'Faltan cuentas contables',
        description: 'Selecciona una cuenta para cada rol requerido.',
      });
      return;
    }

    if (!isBalanced) {
      toast.error({
        title: 'El asiento no está cuadrado',
        description:
          'El total de débitos debe ser igual al total de créditos.',
      });
      return;
    }

    saveMutation.mutate(
      { operationType, details },
      {
        onSuccess: () => {
          setAccountConfig(details);
          next();
        },
        onError: (error: any) => {
          toast.error({
            title: 'No se pudo guardar la configuración',
            description:
              error?.response?.data?.message ??
              'Verifica las cuentas seleccionadas.',
          });
        },
      },
    );
  };

  if (!preview || !operationType) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay una vista previa disponible.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          Configuración de cuentas contables
        </h2>
        <p className="text-sm text-muted-foreground">
          Define la regla del asiento para esta operación. El rol determina
          qué monto va a cada cuenta.
        </p>
      </div>

      {accountsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando plan de cuentas...
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rol / concepto</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="min-w-64">Cuenta contable</TableHead>
                <TableHead className="w-32">Tipo</TableHead>
                <TableHead className="w-28 text-center">Auxiliar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.map((detail) => {
                const role = requiredRoles.find(
                  (item) => item.role === detail.role,
                );

                return (
                  <TableRow key={detail.role}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {role?.label ?? detail.role}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {detail.role}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(roleTotal(detail.role), 'VES')}
                    </TableCell>
                    <TableCell>
                      <SelectSearchable
                        options={accounts.map((account) => ({
                          value: account.id,
                          label: `${account.code} - ${account.name}`,
                        }))}
                        value={detail.accountPlanId || undefined}
                        onValueChange={(value) =>
                          updateDetail(detail.role, {
                            accountPlanId: value ?? '',
                          })
                        }
                        placeholder="Seleccionar cuenta"
                        searchDelay={250}
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={detail.movementType}
                        onChange={(event) =>
                          updateDetail(detail.role, {
                            movementType: event.target
                              .value as SpecialOperationMovementType,
                          })
                        }
                      >
                        <option value="DEBIT">Débito</option>
                        <option value="CREDIT">Crédito</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-center">
                      {role?.defaultIsAuxiliary === false ? (
                        <span className="text-xs text-muted-foreground">
                          No aplica
                        </span>
                      ) : (
                        <Checkbox
                          checked={detail.isAuxiliary}
                          onCheckedChange={(checked) =>
                            updateDetail(detail.role, {
                              isAuxiliary: checked === true,
                            })
                          }
                          aria-label={`Auxiliar para ${detail.role}`}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Débitos" value={debitTotal} />
        <SummaryCard label="Créditos" value={creditTotal} />
        <SummaryCard
          label="Diferencia"
          value={debitTotal - creditTotal}
          danger={!isBalanced}
        />
      </div>

      {!isBalanced && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>El asiento no está cuadrado</AlertTitle>
          <AlertDescription>
            Ajusta las cuentas o el tipo de movimiento hasta que el total de
            débitos sea igual al total de créditos.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={back}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Atrás
        </Button>
        <Button
          onClick={handleContinue}
          disabled={
            saveMutation.isPending ||
            !isReady ||
            !isComplete ||
            !isBalanced
          }
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Guardar y continuar
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          danger
            ? 'text-lg font-semibold text-destructive'
            : 'text-lg font-semibold'
        }
      >
        {formatCurrency(value, 'VES')}
      </p>
    </div>
  );
}
