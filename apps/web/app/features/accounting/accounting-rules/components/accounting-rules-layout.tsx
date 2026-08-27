import { useCategoriesByTypeQuery } from '@/features/core/categories/hooks/use-categories-queries';
import { useCreditTypesQuery } from '@/features/savings/credits/type-credits/hooks/use-credit-types-query';
import { useLoanTypesQuery } from '@/features/savings/loans/type-loans/hooks/use-type-loans-query';
import { useWithdrawalTypesQuery } from '@/features/savings/withdrawals/withdrawal-types/hooks/use-withdrawal-types-query';
import { Badge } from '@repo/shadcn/badge';
import { Heading } from '@repo/shadcn/heading';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { Separator } from '@repo/shadcn/separator';
import { Blocks, ClipboardList } from 'lucide-react';
import { useMemo } from 'react';
import {
  getOperationDef,
  operationTypeTranslations,
} from '../constants/operations';
import { useAccountingRulesParams } from '../hooks/use-accounting-rules-params';
import { useAllAccountingRules } from '../hooks/use-all-accounting-rules';
import { AccountingRuleForm } from './accounting-rule-form';
import { AccountingRuleSidebar } from './accounting-rule-sidebar';

interface EntityOption {
  value: string;
  label: string;
  configured: boolean;
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
      <div className="rounded-full bg-muted p-4 mb-4">
        <ClipboardList className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Seleccione una operación</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Elija una categoría y un tipo de operación en el panel lateral para
        crear o editar una regla contable.
      </p>
    </div>
  );
}

function EntitySelector({
  operation,
  onSelect,
}: {
  operation: string;
  onSelect: (reference: string) => void;
}) {
  const { data: allRules } = useAllAccountingRules();

  const { data: withdrawalData, isLoading: wLoading } = useWithdrawalTypesQuery(
    { page: 1, limit: 100, sortBy: 'id', sortOrder: 'asc' },
    operation === 'WITHDRAWAL_TYPE',
  );
  const { data: loanData, isLoading: lLoading } = useLoanTypesQuery(
    { page: 1, limit: 100, sortBy: 'id', sortOrder: 'asc' },
    operation === 'LOAN_TYPE',
  );
  const { data: creditData, isLoading: cLoading } = useCreditTypesQuery(
    { page: 1, limit: 100, sortBy: 'id', sortOrder: 'asc' },
    operation === 'CREDIT_TYPE',
  );
  const { data: payrollData, isLoading: pLoading } = useCategoriesByTypeQuery(
    'payroll_type',
    operation === 'PAYROLL_CONCEPT',
  );

  const isLoading =
    operation === 'WITHDRAWAL_TYPE'
      ? wLoading
      : operation === 'LOAN_TYPE'
        ? lLoading
        : operation === 'CREDIT_TYPE'
          ? cLoading
          : operation === 'PAYROLL_CONCEPT'
            ? pLoading
            : false;

  const configuredRefs = useMemo(() => {
    if (!allRules) return new Set<string>();
    return new Set(
      allRules
        .filter(
          (r: { operationType: string; referenceValue?: string | null }) =>
            r.operationType === operation && r.referenceValue,
        )
        .map((r) => r.referenceValue as string),
    );
  }, [allRules, operation]);

  const entityOptions: EntityOption[] = useMemo(() => {
    if (operation === 'WITHDRAWAL_TYPE' && withdrawalData?.data) {
      return withdrawalData.data.map(
        (w: { id: string; description: string }) => ({
          value: w.id,
          label: w.description,
          configured: configuredRefs.has(w.description),
        }),
      );
    }
    if (operation === 'LOAN_TYPE' && loanData?.data) {
      return loanData.data.map((l) => ({
        value: l.id ?? '',
        label: l.name,
        configured: configuredRefs.has(l.name),
      }));
    }
    if (operation === 'CREDIT_TYPE' && creditData?.data) {
      return creditData.data.map((c) => ({
        value: c.id ?? '',
        label: c.name,
        configured: configuredRefs.has(c.name),
      }));
    }
    if (operation === 'PAYROLL_CONCEPT' && payrollData) {
      return payrollData.map((p: { id: string; name: string }) => ({
        value: p.id,
        label: p.name,
        configured: configuredRefs.has(p.name),
      }));
    }
    return [];
  }, [
    operation,
    withdrawalData,
    loanData,
    creditData,
    payrollData,
    configuredRefs,
  ]);

  const configuredOptions = entityOptions.filter((o) => o.configured);
  const unconfiguredOptions = entityOptions.filter((o) => !o.configured);

  const selectOptions = [
    ...(configuredOptions.length > 0
      ? [
          {
            value: '__configured__',
            label: `— Configuradas (${configuredOptions.length}) —`,
          },
          ...configuredOptions,
        ]
      : []),
    ...(unconfiguredOptions.length > 0
      ? [
          {
            value: '__pending__',
            label: `— Pendientes (${unconfiguredOptions.length}) —`,
          },
          ...unconfiguredOptions,
        ]
      : []),
  ];

  const operationLabel = operationTypeTranslations[operation] || operation;

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <div className="rounded-full bg-muted p-3 mb-2 inline-flex">
            <Blocks className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">{operationLabel}</h3>
          <p className="text-sm text-muted-foreground">
            Seleccione la entidad para configurar su regla contable
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center">
            Cargando entidades...
          </p>
        ) : entityOptions.length > 0 ? (
          <div className="space-y-3">
            <SelectSearchable
              options={selectOptions.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              onValueChange={(value) => {
                if (
                  value &&
                  value !== '__configured__' &&
                  value !== '__pending__'
                ) {
                  onSelect(value);
                }
              }}
              placeholder={`Buscar ${operationLabel.toLowerCase()}...`}
            />

            {configuredOptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {configuredOptions.map((opt) => (
                  <Badge
                    key={opt.value}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => onSelect(opt.value)}
                  >
                    {opt.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            No existen tipos creados para configurar una regla contable.
          </p>
        )}
      </div>
    </div>
  );
}

export function AccountingRulesLayout() {
  const { category, operation, reference, setReference } =
    useAccountingRulesParams();

  const opDef = operation ? getOperationDef(operation) : undefined;
  const isDynamic = opDef?.isDynamic ?? false;

  const showEntitySelector = operation && isDynamic && !reference;
  const showForm = operation && (!isDynamic || (isDynamic && !!reference));

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-6 pt-6 pb-3">
        <Heading
          title="Mapa de Integración Contable"
          description="Configura el mapa de integración contable"
        />
      </div>
      <Separator className="mt-4" />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 shrink-0 overflow-hidden">
          <AccountingRuleSidebar />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden bg-muted/20">
          {showForm ? (
            <AccountingRuleForm
              key={`${category}-${operation}-${reference ?? 'static'}`}
              category={category}
              operationType={operation}
              reference={reference}
            />
          ) : showEntitySelector ? (
            <EntitySelector
              operation={operation}
              onSelect={(ref) => setReference(ref)}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}
