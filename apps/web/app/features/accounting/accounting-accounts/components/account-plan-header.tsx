import { Heading } from '@repo/shadcn/heading';

export function AccountPlanHeader() {
  return (
    <div className="flex items-start justify-between">
      <Heading
        title="Cuentas Contables"
        description="Gestiona las cuentas contables del plan de cuentas"
      />
    </div>
  );
}
